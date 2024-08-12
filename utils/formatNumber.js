function formatNumber(number) {
    return new Intl.NumberFormat().format(number);
}

module.exports = { formatNumber };
