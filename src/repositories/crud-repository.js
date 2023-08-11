let { logger } = require('../config')

class crudRepository {
    constructor(model) {
        this.model = model
    }


    //create
    async create(data) {
        let response = await this.model.create(data)
        return response
    }

    //Read
    async get(data) {

        let response = await this.model.findByPk(data)
        return response

    }


    async getAll() {

        let response = await this.model.findAll();
        return response

    }
    //Update
    async update(id, data) {
        let response = await this.model.update(data, {
            where: {
                id: id
            }
        })
        return response;

    }
    //delete
    async destroy(id) {

        let response = await this.model.destroy({
            where: {
                id: id
            }
        })
       return response

    }
}
module.exports = crudRepository