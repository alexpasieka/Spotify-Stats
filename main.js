const width = 500;
const height = 400;

const topMargin = 15;
const rightMargin = 15;
const bottomMargin = 55;

let scatterPlotLeftMargin = 55;
let barChartLeftMargin = 25;

const transitionDuration = 1000;

let scatterPlot;
let barChart;

let dataset;
let xScale, yScale;
let xAxis, yAxis;

let scatterPlotYAxisGroup;
let barChartXAxisGroup, barChartYAxisGroup;

let bindKey;

const keyConverter = key => {
    key = parseInt(key);
    switch (key) {
        case 0:
            return "C";
        case 1:
            return "C♯";
        case 2:
            return "D";
        case 3:
            return "E♭";
        case 4:
            return "E";
        case 5:
            return "F";
        case 6:
            return "F♯";
        case 7:
            return "G";
        case 8:
            return "A♭";
        case 9:
            return "A";
        case 10:
            return "B♭";
        case 11:
            return "B";
    }
};

const modeConverter = mode => {
    mode = parseInt(mode);
    switch (mode) {
        case 0:
            return "major";
        case 1:
            return "minor";
    }
};

const rowConverter = d => {
    return {
        id: d.id,
        name: d.name,
        artist: d.artists,
        tempo: parseFloat(d.tempo),
        loudness: parseFloat(d.loudness),
        energy: parseFloat(d.energy),
        acousticness: parseFloat(d.acousticness),
        key: parseFloat(d.key),
        mode: modeConverter(d.mode)
    }
};

const mouseEvents = (selection, color, primaryText, secondaryText) => {
    selection
        .on('mouseover', function() {
            d3.select(this)
                .transition('hover')
                .attr('fill', 'white')
                .attr('r', 10);

            selection.on('mousemove', () => {
                const bodyDOMElem = d3.select('body').node();
                const [mouseX, mouseY] = d3.mouse(bodyDOMElem);

                d3.select("#tooltip")
                    .style("left",  `${mouseX + 20}px`)
                    .style("top", `${mouseY}px`)
                    .html(`${this.getAttribute(primaryText)}<br>${this.getAttribute(secondaryText)}`);
            });

            d3.select("#tooltip")
                .classed("hidden", false);
        })
        .on("mouseout", function() {
            d3.select(this)
                .transition('hover')
                .attr('fill', color)
                .attr('r', 5);

            d3.select("#tooltip")
                .classed("hidden", true);

            selection.on('mousemove', null);
        });
};

const makeScatterPlot = (dataset, variable, yAxisLabel) => {
    bindKey = d => d.id;

    scatterPlot = d3.select('#scatterPlot')
        .attr('width', width)
        .attr('height', height);

    xScale = d3.scaleLinear()
        .domain([0, 1])
        .range([scatterPlotLeftMargin, width - rightMargin]);

    yScale = d3.scaleLinear()
        .domain([d3.min(dataset, d => d[variable]), d3.max(dataset, d => d[variable])])
        .range([height - bottomMargin, topMargin])
        .nice();

    scatterPlot.selectAll('circle')
        .data(dataset, bindKey)
        .enter()
        .append('circle')
        .attr('cx', d => xScale(d.energy))
        .attr('cy', d => yScale(d[variable]))
        .attr('r', 5)
        .attr('fill', '#1DB954')
        .attr('name', d => `"${d.name}"`)
        .attr('artist', d => `- ${d.artist}`)
        .call(mouseEvents, '#1DB954', 'name', 'artist');

    xAxis = d3.axisBottom(xScale);
    yAxis = d3.axisLeft(yScale);

    scatterPlot.append('g')
        .attr('class', 'axis')
        .attr('transform', `translate(0, ${height - bottomMargin})`)
        .call(xAxis);

    scatterPlot.append("text")
        .attr("text-anchor", "middle")
        .attr("x", (width + scatterPlotLeftMargin + rightMargin) / 2)
        .attr("y", height - 12)
        .text("Energy");

    scatterPlotYAxisGroup = scatterPlot.append('g')
        .attr('class', 'axis')
        .attr('transform', `translate(${scatterPlotLeftMargin}, 0)`)
        .call(yAxis);

    scatterPlot.append("text")
        .attr("text-anchor", "middle")
        .attr("x", -(height - topMargin - bottomMargin) / 2)
        .attr("y", 12)
        .attr("transform", "rotate(-90)")
        .attr('id', 'yAxisLabel')
        .text(yAxisLabel);
};

const updateScatterPlot = (dataset, variable, yAxisLabel) => {
    bindKey = d => d.id;

    xScale = d3.scaleLinear()
        .domain([0, 1])
        .range([scatterPlotLeftMargin, width - rightMargin]);

    yScale = d3.scaleLinear()
        .domain([d3.min(dataset, d => d[variable]), d3.max(dataset, d => d[variable])])
        .range([height - bottomMargin, topMargin])
        .nice();

    scatterPlot.selectAll('circle')
        .data(dataset, bindKey)
        .transition()
        .duration(transitionDuration)
        .attr('cy', d => yScale(d[variable]));

    yAxis = d3.axisLeft(yScale);

    scatterPlotYAxisGroup
        .transition()
        .duration(transitionDuration)
        .call(yAxis);

    scatterPlot.select("#yAxisLabel").text(yAxisLabel);
};

const groupData = (dataset, variable, range) => {
    let groupedDataset = [];
    let start;
    let end;

    for (let i = Math.floor(d3.min(dataset, d => d[variable]) / range);
         i < Math.ceil(d3.max(dataset, d => d[variable]) / range); i++) {
        start = i * range;
        end = (i + 1) * range;

        groupedDataset.push({
            range: start,
            values: dataset.filter(d => d[variable] >= start && d[variable] < end)
        });
    }

    return groupedDataset;
};

const makeBarChart = (dataset, variable, range, xAxisLabel) => {
    let groupedDataset = groupData(dataset, variable, range);

    bindKey = d => d.range;

    barChart = d3.select('#barChart')
        .attr('width', width)
        .attr('height', height);

    xScale = d3.scaleLinear()
        .domain([groupedDataset[0].range, groupedDataset[groupedDataset.length - 1].range + range])
        .range([barChartLeftMargin, width - rightMargin]);

    yScale = d3.scaleLinear()
        .domain([0, d3.max(groupedDataset, d => d.values.length)])
        .range([height - bottomMargin, topMargin])
        .nice();

    barChart.selectAll('rect')
        .data(groupedDataset, bindKey)
        .enter()
        .append('rect')
        .attr('x', d => xScale(d.range) + 1)
        .attr('y', d => yScale(d.values.length))
        .attr('width', width / groupedDataset.length - 10)
        .attr('height', d => (height - bottomMargin) - yScale(d.values.length))
        .attr('fill', '#1DB954')
        .attr('range', d => `${d.range} - ${d.range + range} BPM`)
        .attr('amount', d => d.values.length)
        .call(mouseEvents, '#1DB954', 'range', 'amount');

    xAxis = d3.axisBottom(xScale);
    yAxis = d3.axisLeft(yScale);

    barChartXAxisGroup = barChart.append('g')
        .attr('class', 'axis')
        .attr('transform', `translate(0, ${height - bottomMargin})`)
        .call(xAxis);

    barChart.append("text")
        .attr("text-anchor", "middle")
        .attr("x", (width + barChartLeftMargin + rightMargin) / 2)
        .attr("y", height - 15)
        .attr('id', 'xAxisLabel')
        .text(xAxisLabel);

    barChartYAxisGroup = barChart.append('g')
        .attr('class', 'axis')
        .attr('transform', `translate(${barChartLeftMargin}, 0)`)
        .call(yAxis);
};

const updateBarChart = (dataset, variable, range, unit, xAxisLabel) => {
    let groupedDataset = groupData(dataset, variable, range);

    bindKey = d => d.range;

    xScale = d3.scaleLinear()
        .domain([groupedDataset[0].range, groupedDataset[groupedDataset.length - 1].range + range])
        .range([barChartLeftMargin, width - rightMargin]);

    yScale = d3.scaleLinear()
        .domain([0, d3.max(groupedDataset, d => d.values.length)])
        .range([height - bottomMargin, topMargin])
        .nice();

    const bars = barChart.selectAll('rect')
        .data(groupedDataset, bindKey);

    bars.exit()
        .transition()
        .duration(transitionDuration / 2)
        .attr('y', height - bottomMargin)
        .attr('height', 0)
        .remove();

    bars.enter()
        .append('rect')
        .attr('x', d => xScale(d.range) + 1)
        .attr('y', height - bottomMargin)
        .attr('width', width / groupedDataset.length - 10)
        .attr('height', 0)
        .attr('fill', '#1DB954')
        .attr('range', d => {
            if (unit === '') {
                return `${d.range.toPrecision(1)} - ${(d.range + range).toPrecision(1)} ${unit}`
            }
            else {
                return `${d.range} - ${d.range + range} ${unit}`
            }
        })
        .attr('amount', d => d.values.length)
        .call(mouseEvents, '#1DB954', 'range', 'amount')
    .merge(bars)
            .transition()
            .duration(transitionDuration / 2)
            .delay(transitionDuration / 2)
            .attr('y', d => yScale(d.values.length))
            .attr('height', d => (height - bottomMargin) - yScale(d.values.length));

    xAxis = d3.axisBottom(xScale);
    yAxis = d3.axisLeft(yScale);

    barChartXAxisGroup
        .transition()
        .duration(transitionDuration)
        .call(xAxis);

    barChartYAxisGroup
        .transition()
        .duration(transitionDuration)
        .call(yAxis);

    barChart.select("#xAxisLabel").text(xAxisLabel);
};

const makeDoubleBarChart = dataset => {
    dataset.sort((a, b) => a.key - b.key);
    dataset.forEach(d => d.key = keyConverter(d.key));

    bindKey = d => d.key;

    let keys = d3.nest()
        .key(d => d.key)
        .key(d => d.mode)
        .entries(dataset);

    let doubleBarChart = d3.select('#doubleBarChart')
        .attr('width', width)
        .attr('height', height);

    xScale = d3.scaleBand()
        .domain(keys.map(d => d.key))
        .range([barChartLeftMargin, width])
        .paddingInner(0.35)
        .paddingOuter(0.35);

    yScale = d3.scaleLinear()
        .domain([0, d3.max(keys, d => Math.max(d.values[0].values.length, d.values[1].values.length))])
        .range([height - bottomMargin, topMargin])
        .nice();

    let bars = doubleBarChart.selectAll('rect')
        .data(keys, bindKey)
        .enter()
        .append('g');

    bars.append('rect')
        .attr('x', d => xScale(d.key))
        .attr('y', d => yScale(d.values[0].values.length))
        .attr('width', xScale.bandwidth() / 2)
        .attr('height', d => (height - bottomMargin) - yScale(d.values[0].values.length))
        .attr('fill', '#1DB954')
        .attr('key', d => `${d.key} major`)
        .attr('amount', d => d.values[0].values.length)
        .call(mouseEvents, '#1DB954', 'key', 'amount');

    bars.append('rect')
        .attr('x', d => xScale(d.key) + xScale.bandwidth() / 2)
        .attr('y', d => yScale(d.values[1].values.length))
        .attr('width', xScale.bandwidth() / 2)
        .attr('height', d => (height - bottomMargin) - yScale(d.values[1].values.length))
        .attr('fill', '#117333')
        .attr('key', d => `${d.key} minor`)
        .attr('amount', d => d.values[1].values.length)
        .call(mouseEvents, '#117333', 'key', 'amount');

    let legend = doubleBarChart.append('g').attr('id', 'legend');

    legend.append('rect')
        .attr('x', 0)
        .attr('y', height - 20)
        .attr('width', 10)
        .attr('height', 10)
        .attr('fill', '#1DB954');
    legend.append('text')
        .attr("x", 15)
        .attr("y", height - 10)
        .text('Major');

    legend.append('rect')
        .attr('x', 100)
        .attr('y', height - 20)
        .attr('width', 10)
        .attr('height', 10)
        .attr('fill', '#117333');
    legend.append('text')
        .attr("x", 115)
        .attr("y", height - 10)
        .text('Minor');

    legend.attr('transform',
        `translate(${(width / 2) - (document.querySelector("#legend").getBBox().width / 2)}, 0)`);

    xAxis = d3.axisBottom(xScale);
    yAxis = d3.axisLeft(yScale);

    doubleBarChart.append('g')
        .attr('class', 'bottomAxis')
        .attr('transform', `translate(0, ${height - bottomMargin})`)
        .call(xAxis);

    doubleBarChart.append('g')
        .attr('class', 'axis')
        .attr('transform', `translate(25, 0)`)
        .call(yAxis);
};

window.onload = () => {
    d3.csv('data.csv', rowConverter)
        .then((data) => {
            dataset = data;

            makeScatterPlot(dataset, 'tempo', 'Tempo (BPM)');
            document.querySelector("#tempoScatter").onclick = () =>
                updateScatterPlot(dataset, 'tempo', 'Tempo (BPM)');
            document.querySelector("#loudnessScatter").onclick = () =>
                updateScatterPlot(dataset, 'loudness', 'Loudness (dB)');

            makeBarChart(dataset, 'tempo', 20, 'Tempo (BPM)');
            document.querySelector("#tempoBar").onclick = () =>
                updateBarChart(dataset, 'tempo', 20, 'BPM', 'Tempo (BPM)');
            document.querySelector("#loudnessBar").onclick = () =>
                updateBarChart(dataset, 'loudness', 1, 'dB', 'Loudness (dB)');
            document.querySelector("#acousticnessBar").onclick = () =>
                updateBarChart(dataset, 'acousticness', 0.1, '', 'Acousticness');

            makeDoubleBarChart(dataset);
        });
};