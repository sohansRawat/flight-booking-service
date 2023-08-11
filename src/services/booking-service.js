const axios = require('axios')
const { ServerConfig,Queue } = require('../config')

let AppError = require('../utils/errors/app-error')
const { BookingRepository } = require('../repositories')
const db = require('../models')
const { StatusCodes } = require('http-status-codes')

const {ENUM}=require('../utils/common')
const{BOOKED,CANCELLED,INITIATED,PENDING}=ENUM.BOOKING_STATUS


const bookingRepository = new BookingRepository()

async function createBooking(data) {
    const transaction = await db.sequelize.transaction()
    try {
        const flight = await axios.get(`${ServerConfig.FLIGHT_SERVICE}/api/v1/flights/${data.flightId}`)
        flightData = flight.data.data
        if (data.noofSeats > flightData.totalSeats) {
            throw new AppError('Not enough seats available', StatusCodes.BAD_REQUEST)
        }
        const totalBillingAmount=data.noofSeats*flightData.price
        const bookingPayload={...data,totalCost:totalBillingAmount}
        const booking = await bookingRepository.create(bookingPayload,transaction)
        
        await axios.patch(`${ServerConfig.FLIGHT_SERVICE}/api/v1/flights/${data.flightId}/seats`,{seats:data.noofSeats})


        await transaction.commit()
        return booking
    } catch (error) {
        await transaction.rollback()
        throw error
    }
}

async function makePayment(data){
    const transaction = await db.sequelize.transaction()
    
    try{
        const bookingDetails = await bookingRepository.get(data.bookingId,transaction)
        if(bookingDetails.status==CANCELLED){
            throw new AppError('the booking has expired',StatusCodes.BAD_REQUEST)
        }
        const bookingTime = new Date(bookingDetails.createdAt)
        const currentTime=new Date()
        if(currentTime - bookingTime>300000){
            await cancelBooking(data.bookingId)
            throw new AppError('the booking has expired',StatusCodes.BAD_REQUEST)
        }
        if(bookingDetails.totalCost != data.totalCost){
            throw new AppError('The amount of the payment doesnt match', StatusCodes.BAD_REQUEST)
        }
        if(bookingDetails.userId != data.userId){
            throw new AppError('The user corresponding to the bookind doesnt match', StatusCodes.BAD_REQUEST)
        }

        //we assume here that payment is succesfull
        await bookingRepository.update(data.bookingId,{status:BOOKED},transaction)
        Queue.sendData({
            recepientEmail:'born4destroy@gmail.com',
            subject:'flight booked',
            text:`Booking successfully done for the flight ${data.bookingId}`
        })
        await transaction.commit()
        
    }catch(error){
        await transaction.rollback()
        throw error
    }
}

async function cancelBooking(bookingId){
    const transaction = await db.sequelize.transaction()
    try{
        const bookingDetails = await bookingRepository.get(bookingId,transaction)
        if(bookingDetails.status==CANCELLED){
            await transaction.commit();
            return true
        }
        await axios.patch(`${ServerConfig.FLIGHT_SERVICE}/api/v1/flights/${bookingDetails.flightId}/seats`,{seats:bookingDetails.noofSeats,dec:'false'})
        await bookingRepository.update(bookingId,{status:CANCELLED},transaction)
        await transaction.commit();
    }catch(error){
        await transaction.rollback()
        throw error
    }
}

async function cancelOldBookings(){
    try{
        const time=new Date(Date.now()-1000*300)//time 5 min ago 
        const response = await bookingRepository.cancelOldBookings(time)
        return response 
    }catch(error){
        console.log(error)
    }
}
module.exports = {
    createBooking,
    makePayment,
    cancelOldBookings
}