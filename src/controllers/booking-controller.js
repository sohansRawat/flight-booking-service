const{StatusCodes}=require('http-status-codes')
const {BookingService}=require('../services')
let { ErrorResponse, SuccessResponse } = require('../utils/common')
let AppError = require('../utils/errors/app-error')

async function createBooking(req, res) {
    try {
        console.log('sohan bhai agya')
        let response = await BookingService.createBooking({
            flightId:req.body.flightId,
            userId:req.body.userId,
            noofSeats:req.body.noofSeats
        })
        SuccessResponse.data = response
        return res.status(StatusCodes.CREATED).json(SuccessResponse)
    } catch (error) {
        ErrorResponse.error = error;
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse)
    }
}

let inMemoryDb={}
async function makePayment(req, res) {
    try {
        const idempotencyKey=req.headers['x-idempotency-key']
        if(!idempotencyKey){
            return res.status(StatusCodes.BAD_REQUEST).json({message:'idempotency key is missing'})
        }
        if(inMemoryDb[idempotencyKey]){
            return res.status(StatusCodes.BAD_REQUEST).json({message:'Cannot try on a succesfull payment'})
        }
        let response = await BookingService.makePayment({
            totalCost:req.body.totalCost,
            userId:req.body.userId,
            bookingId:req.body.bookingId
        })
        inMemoryDb[idempotencyKey]=idempotencyKey
        SuccessResponse.data = response
        return res.status(StatusCodes.CREATED).json(SuccessResponse)
    } catch (error) {
        ErrorResponse.error = error;
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(ErrorResponse)
    }
}


module.exports = {
    createBooking,
    makePayment
}