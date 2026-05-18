class ErrorLogger {
    log(error) {
        console.error(error);
    }
}
module.exports = new ErrorLogger();
