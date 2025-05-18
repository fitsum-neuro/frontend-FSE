const mongoose=require('mongoose');

const { logger } = require("../middlewares/error");
module.exports=function(){
    mongoose.connect('mongodb://localhost:27017/delta')
    .then(()=>logger.info('Connected to the database...'))
}