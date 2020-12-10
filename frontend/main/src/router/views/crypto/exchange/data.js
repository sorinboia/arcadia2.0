const priceCandlestickChart = {
    chartOptions: {
        chart: {
            type: 'candlestick',
            height: 310,
            toolbar: false,
            zoom: {
                enabled: true,
            }
        },
        plotOptions: {
            candlestick: {
                colors: {
                    upward: '#34c38f',
                    downward: '#f46a6a'
                }
            }
        },
        xaxis: {
            type: 'datetime'
        },
        yaxis: {
            decimalsInFloat: 0,
            tooltip: {
                enabled: true
            }
        }
    }
};

const notificationData = [
    {
        id: 1,
        date: '15 Mar ',
        text: 'If several languages coalesce of the resulting.'
    },
    {
        id: 2,
        date: '14 Mar ',
        text: 'New common language will be more simple and regular than the existing'
    },
    {
        id: 3,
        date: '10 Mar',
        text: 'It will seem like simplified English as a skeptical Cambridge'
    },
    {
        id: 4,
        date: '13 Mar',
        text: 'To achieve this, it would be necessary'
    },
    {
        id: 5,
        date: '12 Mar ',
        text: 'Cum sociis natoque penatibus et magnis dis'
    },
    {
        id: 6,
        date: '11 Mar ',
        text: 'New common language will be more simple and regular than the existing'
    },
    {
        id: 7,
        date: '10 Mar ',
        text: 'It will seem like simplified English as a skeptical Cambridge'
    },
    {
        id: 8,
        date: '09 Mar ',
        text: 'To achieve this, it would be necessary'
    },
];

export { priceCandlestickChart, notificationData };
