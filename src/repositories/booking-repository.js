let crudRepository=require('./crud-repository')
let {Booking}=require('../models')
const AppError = require('../utils/errors/app-error')
const { StatusCodes } = require('http-status-codes')
const {Op}=require('sequelize')
const {ENUM}=require('../utils/common')
const{BOOKED,CANCELLED}=ENUM.BOOKING_STATUS

class BookingRepository extends crudRepository{
    constructor(){
        super(Booking)
    }

    async create(data,transaction){
        const response = await Booking.create(data,{transaction:transaction})
        return response
    }

    async get(data,transaction) {
        let response = await Booking.findByPk(data,{transaction:transaction})
        if(!response){
            throw new AppError('Not able to find the resource ',StatusCodes.NOT_FOUND)
        }
        return response

    }

    async update(id, data,transaction) {
        let response = await Booking.update(data, {
            where: {
                id: id
            }
        },{transaction:transaction})
        return response;

    }

    async cancelOldBookings(timestamp){
        // console.log('sohan bhai mai agya')
        const response = await Booking.update({status:CANCELLED},{
            where:{
                [Op.and]:[
                   {
                    createdAt:{
                        [Op.lt]:timestamp 
                    }
                   },
                   {
                    status:{
                        [Op.ne]:BOOKED
                    }
                   },
                   {
                    status:{
                        [Op.ne]:CANCELLED
                    }
                   }
                ]
            }
        })
        return response
    }

}

module.exports=BookingRepository