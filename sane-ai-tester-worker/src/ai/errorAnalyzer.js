class ErrorAnalyzer {
    analyze(error) {
        return error.message || String(error);
    }
}
module.exports = new ErrorAnalyzer();
