const graphWidth = 600;
const graphHeight = 600;

const width = 350;
const height = 350;

//Define SVG and Tooltip
const svg = d3
  .select('.player-map')
  .attr('width', graphWidth)
  .attr('height', graphHeight)
  .append('g');
svg.append('g').attr('class', 'labels');
svg.append('g').attr('class', 'lines');

const tooltip = d3.select('.map-tooltip');
const colorPicker = d3.scaleOrdinal(d3.schemeCategory20);
//Load csv data
d3.csv('./data/playerdata.csv', data => {
  drawPlayerMap(data);
});

//Draw player graph once data is loaded
function drawPlayerMap(data) {
  if (data.columns) {
    delete data.columns;
  }
  const radius = Math.min(width, height) / 2;
  const pie = d3
    .pie()
    .sort(null)
    .value(d => {
      return d.Count;
    });

  const arc = d3
    .arc()
    .innerRadius(radius * 0.8)
    .outerRadius(radius * 0.5);

  const outerArc = d3
    .arc()
    .outerRadius(radius * 0.9)
    .innerRadius(radius * 0.9);

  svg.attr('transform', 'translate(' + width * 0.9 + ',' + height * 0.85 + ')');

  const path = svg
    .selectAll('path')
    .data(pie(data))
    .enter()
    .append('path')
    .attr('d', arc)
    .attr('fill', (d, i) => colorPicker(i))
    .on('mousemove', d => {
      showTooltip(d);
    })
    .on('mouseleave', d => {
      tooltip.style('visibility', 'hidden');
      d3.select('#imageid').remove();
      d3.select('#circleid').remove();
    })
    .on('click', d => {
      drawPlayerDetailGraph(d);
    });

  path
    .transition()
    .duration(1000)
    .attrTween('d', function(d) {
      var interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
      return function(t) {
        return arc(interpolate(t));
      };
    });

  const polyline = svg
    .select('.lines')
    .selectAll('polyline')
    .data(pie(data))
    .enter()
    .append('polyline')
    .attr('points', function(d) {
      const pos = outerArc.centroid(d);
      pos[0] = radius * 0.95 * (midAngle(d) < Math.PI ? 1 : -1);
      return [arc.centroid(d), outerArc.centroid(d), pos];
    });

  const label = svg
    .select('.labels')
    .selectAll('text')
    .data(pie(data))
    .enter()
    .append('text')
    .attr('dy', '.35em')
    .html(function(d) {
      return d.data.Player;
    })
    .attr('transform', function(d) {
      const pos = outerArc.centroid(d);
      pos[0] = radius * 0.95 * (midAngle(d) < Math.PI ? 1 : -1);
      return 'translate(' + pos + ')';
    })
    .style('text-anchor', function(d) {
      return midAngle(d) < Math.PI ? 'start' : 'end';
    });

  svg.append('g').attr('class', 'slices');
  const text = svg
    .select('.slices')
    .selectAll('text')
    .data(pie(data))
    .enter()
    .append('text')
    .attr('transform', function(d) {
      return 'translate(' + arc.centroid(d) + ')';
    })
    .attr('dy', '.4em')
    .attr('text-anchor', 'middle')
    .style('fill', 'black')
    .style('font-size', '20px')
    .text(function(d) {
      return d.data.Count;
    });
}

function midAngle(d) {
  return d.startAngle + (d.endAngle - d.startAngle) / 2;
}

//Show tooltip on mousemove
function showTooltip(d) {
  let winningYears = d.data['Winning Years'];
  if (winningYears.includes('-')) {
    winningYears = winningYears.replace(/-/g, ', ');
  }
  const html = `
    <p class="head"></p>
    <p class="title"> ${d.data.Player} <p>
    <p> Winning Years <p>
    <p>${winningYears}</p>
  `;
  tooltip.html(html);
  tooltip
    .style('visibility', 'visible')
    .style('top', `${d3.event.layerY + 100}px`)
    .style('left', `${d3.event.layerX + 170}px`);

  //Show Image on center
  d3.select('#imageid').remove();
  d3.select('#circleid').remove();
  svg
    .append('pattern')
    .attr('id', 'imageid')
    .attr('width', 1)
    .attr('height', 1)
    .attr('x', 0)
    .attr('y', 0)
    .append('svg:image')
    .attr('xlink:href', d.data.ImageUrl)
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', 150)
    .attr('height', 150);
  svg
    .append('circle')
    .attr('id', 'circleid')
    .attr('r', '75')
    .attr('cx', '0')
    .attr('cy', '0')
    .attr('fill', `url(#imageid)`);
}

function drawPlayerDetailGraph(player) {
  const heading = document.querySelector('.player-heading');
  document.querySelector('.player-detail').innerHTML = '';
  heading.innerHTML = player.data.Player;
  const data = [
    {
      name: 'Avg 1st Serve',
      value: player.data['Avg 1st Serve']
    },
    {
      name: 'Avg 1st Point Won',
      value: player.data['Avg 1st Point Won']
    },
    {
      name: 'Avg 2nd Point Won',
      value: player.data['Avg 2nd Point Won']
    },
    {
      name: 'Avg Break',
      value: player.data['Avg Break']
    },
    {
      name: 'Avg Return',
      value: player.data['Avg Return']
    },
    {
      name: 'Avg Net',
      value: player.data['Avg Net']
    }
  ];
  const margin = { top: 20, right: 20, bottom: 40, left: 30 },
    width = 550 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

  const x = d3
    .scaleBand()
    .range([0, width])
    .padding(0.5);
  const y = d3.scaleLinear().range([height, 0]);

  const svg = d3
    .select('.player-detail')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  x.domain(
    data.map(el => {
      return el.name;
    })
  );
  y.domain([0, 100]);

  svg
    .selectAll('.bar')
    .data(data)
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('x', d => {
      return x(d.name);
    })
    .attr('width', x.bandwidth())
    .attr('y', d => {
      return height;
    })
    .attr('height', 0)
    .transition()
    .duration(750)
    .delay(function(d, i) {
      return i * 150;
    })
    .attr('y', d => {
      return y(d.value);
    })
    .attr('height', d => {
      return height - y(d.value);
    })
    .attr('fill', colorPicker(player.index));

  svg
    .selectAll('text.bar')
    .data(data)
    .enter()
    .append('text')
    .attr('class', 'bar')
    .attr('text-anchor', 'middle')
    .attr('x', d => {
      return x(d.name) + x.bandwidth() / 2;
    })
    .attr('y', d => {
      return height;
    })
    .attr('height', 0)
    .transition()
    .duration(750)
    .delay((d, i) => {
      return i * 150;
    })
    .attr('y', d => {
      return y(d.value) + 0.1;
    })
    .attr('dy', '-.7em')
    .text(d => {
      return d.value + '%';
    });

  svg
    .append('g')
    .attr('transform', 'translate(0,' + height + ')')
    .call(d3.axisBottom(x))
    .selectAll('text')
    .style('text-anchor', 'end')
    .attr('transform', 'rotate(-15)');

  svg.append('g').call(d3.axisLeft(y));

  svg
    .append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', 0)
    .attr('x', -68)
    .attr('dy', '1em')
    .style('text-anchor', 'top')
    .text('Percentage');
}
