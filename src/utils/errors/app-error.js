class AppError extends Error{
    constructor(message,statuscode){
        super()
        this.stautsCode=statuscode
        this.explanation=message
    }
}

module.exports=AppError