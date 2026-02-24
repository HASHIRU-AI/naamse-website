// D3.js Interactive Scatter Plot for Leaderboard
// X-axis: Adversarial Score, Y-axis: Benign Score, Color-coded by provider
// Provider names and colors are read from model_scores_summary.json

let PROVIDER_COLORS = {};

async function loadLeaderboardChart() {
    try {
        if (typeof d3 === 'undefined') {
            throw new Error('D3.js library not loaded');
        }

        const response = await fetch('./model_scores_summary.json');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        // Get unique providers
        const providers = [...new Set(data.models.map(m => m.provider))];

        // Create color scale using combined unique D3 palettes (25 distinct colors)
        const colorScale = d3.scaleOrdinal([...new Set(d3.schemeCategory10.concat(d3.schemeAccent, d3.schemeDark2))]);

        // Assign colors to providers
        PROVIDER_COLORS = {};
        providers.forEach((provider, index) => {
            PROVIDER_COLORS[provider] = colorScale(index);
        });

        const chartData = buildChartData(data);

        drawChart(chartData);
        window.addEventListener('resize', () => drawChart(chartData));
    } catch (err) {
        console.error('Error loading chart data:', err);
        document.getElementById('leaderboard-chart').innerHTML =
            '<p class="tw-text-center tw-text-gray-500">Unable to load chart data.</p>';
    }
}

function buildChartData(data) {
    const modelMap = new Map();
    data.models.forEach(m => {
        const scores = m.reports.map(r => ({
            adversarial: r.adversarial_score,
            benign: r.benign_score
        }));
        const avgAdv = scores.reduce((s, r) => s + r.adversarial, 0) / scores.length;
        const avgBen = scores.reduce((s, r) => s + r.benign, 0) / scores.length;
        modelMap.set(m.model, { adversarial: avgAdv, benign: avgBen, provider: m.provider || 'Unknown' });
    });

    return Array.from(modelMap.entries()).map(([model, scores]) => ({
        model,
        provider: scores.provider,
        adversarial: scores.adversarial,
        benign: scores.benign
    }));
}

function drawChart(data) {
    const container = document.getElementById('leaderboard-chart');
    container.innerHTML = '';

    const isDark = document.documentElement.classList.contains('tw-dark');

    // Responsive sizing — fills container width, scales height proportionally
    const containerWidth = container.clientWidth;
    const width = containerWidth;
    const height = Math.max(width * 0.55, 450);

    // Scale factor relative to a 900px baseline — all sizes scale proportionally
    const scale = width / 900;
    const dotR        = Math.max(5,  Math.round(7  * scale));
    const dotRHover   = Math.max(7,  Math.round(10 * scale));
    const dotRDim     = Math.max(3,  Math.round(5  * scale));
    const tickFontSz  = Math.max(9,  Math.round(11 * scale)) + 'px';
    const labelFontSz = Math.max(11, Math.round(13 * scale)) + 'px';
    const dotLabelSz  = Math.max(8,  Math.round(10 * scale)) + 'px';
    const dotLabelX   = Math.max(7,  Math.round(10 * scale));
    const axisLabelY  = Math.max(14, Math.round(18 * scale));
    const tooltipFontSz     = Math.max(11, Math.round(12 * scale)) + 'px';
    const tooltipTitleFontSz = Math.max(12, Math.round(13 * scale)) + 'px';
    const legendFontSz = Math.max(11, Math.round(12 * scale)) + 'px';
    const legendDotSz  = Math.max(8,  Math.round(10 * scale)) + 'px';

    const margin = {
        top:    Math.round(40 * scale),
        right:  Math.round(30 * scale),
        bottom: Math.round(60 * scale),
        left:   Math.round(70 * scale)
    };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const textColor    = isDark ? '#d1d5db' : '#374151';
    const gridColor    = isDark ? '#2a2a2a' : '#e5e7eb';
    const bgColor      = isDark ? '#171717' : '#ffffff';
    const tooltipBg    = isDark ? '#1f2937' : '#ffffff';
    const tooltipBorder = isDark ? '#374151' : '#d1d5db';

    const svg = d3.select(container)
        .append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .style('width', '100%')
        .style('height', 'auto')
        .style('display', 'block');

    // Background
    svg.append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('rx', 12)
        .attr('fill', bgColor);

    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xMax = d3.max(data, d => d.adversarial);
    const yMax = d3.max(data, d => d.benign);
    const xScale = d3.scaleLinear()
        .domain([0, Math.ceil((xMax + 5) / 10) * 10])
        .range([0, innerW]);
    const yScale = d3.scaleLinear()
        .domain([0, Math.ceil((yMax + 5) / 10) * 10])
        .range([innerH, 0]);

    // Grid lines
    g.append('g')
        .attr('class', 'grid-y')
        .selectAll('line')
        .data(yScale.ticks(6))
        .enter().append('line')
        .attr('x1', 0).attr('x2', innerW)
        .attr('y1', d => yScale(d)).attr('y2', d => yScale(d))
        .attr('stroke', gridColor)
        .attr('stroke-dasharray', '3,3');

    g.append('g')
        .attr('class', 'grid-x')
        .selectAll('line')
        .data(xScale.ticks(6))
        .enter().append('line')
        .attr('y1', 0).attr('y2', innerH)
        .attr('x1', d => xScale(d)).attr('x2', d => xScale(d))
        .attr('stroke', gridColor)
        .attr('stroke-dasharray', '3,3');

    // Axes
    const xAxis = d3.axisBottom(xScale).ticks(6).tickFormat(d => d + '%');
    const yAxis = d3.axisLeft(yScale).ticks(6).tickFormat(d => d + '%');

    g.append('g')
        .attr('transform', `translate(0,${innerH})`)
        .call(xAxis)
        .selectAll('text').attr('fill', textColor).style('font-size', tickFontSz);
    g.append('g')
        .call(yAxis)
        .selectAll('text').attr('fill', textColor).style('font-size', tickFontSz);

    // Style axis lines
    g.selectAll('.domain').attr('stroke', textColor).attr('stroke-opacity', 0.3);
    g.selectAll('.tick line').attr('stroke', textColor).attr('stroke-opacity', 0.2);

    // Axis labels
    svg.append('text')
        .attr('x', margin.left + innerW / 2)
        .attr('y', height - Math.round(10 * scale))
        .attr('text-anchor', 'middle')
        .attr('fill', textColor)
        .style('font-size', labelFontSz)
        .style('font-weight', '600')
        .text('Adversarial Score (%)');

    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -(margin.top + innerH / 2))
        .attr('y', axisLabelY)
        .attr('text-anchor', 'middle')
        .attr('fill', textColor)
        .style('font-size', labelFontSz)
        .style('font-weight', '600')
        .text('Benign Score (%)');

    // Tooltip
    const tooltip = d3.select(container)
        .append('div')
        .style('position', 'absolute')
        .style('pointer-events', 'none')
        .style('background', tooltipBg)
        .style('border', `1px solid ${tooltipBorder}`)
        .style('border-radius', '8px')
        .style('padding', '10px 14px')
        .style('font-size', tooltipFontSz)
        .style('color', textColor)
        .style('box-shadow', '0 4px 12px rgba(0,0,0,0.15)')
        .style('opacity', 0)
        .style('transition', 'opacity 0.15s')
        .style('z-index', 10);

    // Dots
    const dots = g.selectAll('.dot')
        .data(data)
        .enter().append('g')
        .attr('class', 'dot')
        .attr('data-provider', d => d.provider)
        .attr('transform', d => `translate(${xScale(d.adversarial)},${yScale(d.benign)})`);

    dots.append('circle')
        .attr('r', dotR)
        .attr('fill', d => PROVIDER_COLORS[d.provider] || '#888')
        .attr('fill-opacity', 0.85)
        .attr('stroke', d => PROVIDER_COLORS[d.provider] || '#888')
        .attr('stroke-width', Math.max(1, Math.round(2 * scale)))
        .attr('stroke-opacity', 0.4)
        .style('cursor', 'pointer')
        .on('mouseenter', function (event, d) {
            d3.select(this)
                .transition().duration(150)
                .attr('r', dotRHover)
                .attr('fill-opacity', 1)
                .attr('stroke-opacity', 0.8);

            const rect = container.getBoundingClientRect();
            tooltip
                .html(`
                    <strong style="font-size:${tooltipTitleFontSz}">${d.model}</strong><br/>
                    <span style="color:${PROVIDER_COLORS[d.provider]}">● ${d.provider}</span><br/>
                    <span>Adversarial: <b>${d.adversarial.toFixed(2)}%</b></span><br/>
                    <span>Benign: <b>${d.benign.toFixed(2)}%</b></span>
                `)
                .style('opacity', 1)
                .style('left', (event.clientX - rect.left + 14) + 'px')
                .style('top', (event.clientY - rect.top - 10) + 'px');
        })
        .on('mousemove', function (event) {
            const rect = container.getBoundingClientRect();
            tooltip
                .style('left', (event.clientX - rect.left + 14) + 'px')
                .style('top', (event.clientY - rect.top - 10) + 'px');
        })
        .on('mouseleave', function () {
            d3.select(this)
                .transition().duration(150)
                .attr('r', dotR)
                .attr('fill-opacity', 0.85)
                .attr('stroke-opacity', 0.4);
            tooltip.style('opacity', 0);
        });

    // Labels
    dots.append('text')
        .text(d => shortenLabel(d.model))
        .attr('x', dotLabelX)
        .attr('y', 4)
        .attr('fill', textColor)
        .style('font-size', dotLabelSz)
        .style('font-weight', '500')
        .style('pointer-events', 'none');

    // Legend - rendered as HTML below the chart
    const providers = [...new Set(data.map(d => d.provider))].sort();

    // Remove old legend if exists
    const oldLegend = container.querySelector('.chart-legend');
    if (oldLegend) oldLegend.remove();

    const legendDiv = document.createElement('div');
    legendDiv.className = 'chart-legend';
    legendDiv.style.cssText = `
        display: flex; flex-wrap: wrap; justify-content: center; gap: 12px 24px;
        margin-top: 16px; padding: 12px 20px;
        border: 1px solid ${isDark ? '#2a2a2a' : '#e5e7eb'};
        border-radius: 8px;
        background: ${isDark ? '#171717' : '#ffffff'};
        width: 100%;
    `;

    providers.forEach(provider => {
        const item = document.createElement('div');
        item.style.cssText = 'display: flex; align-items: center; gap: 6px; cursor: pointer; padding: 4px 8px; border-radius: 6px; transition: background 0.15s;';
        item.innerHTML = `
            <span style="width:${legendDotSz};height:${legendDotSz};border-radius:50%;background:${PROVIDER_COLORS[provider] || '#888'};display:inline-block;flex-shrink:0;"></span>
            <span style="font-size:${legendFontSz};color:${textColor};white-space:nowrap;">${provider}</span>
        `;

        item.addEventListener('mouseenter', () => {
            item.style.background = isDark ? '#2a2a2a' : '#f3f4f6';
            g.selectAll('.dot').each(function () {
                const el = d3.select(this);
                const isMatch = el.attr('data-provider') === provider;
                el.select('circle')
                    .transition().duration(150)
                    .attr('r', isMatch ? dotRHover : dotRDim)
                    .attr('fill-opacity', isMatch ? 1 : 0.15)
                    .attr('stroke-opacity', isMatch ? 0.9 : 0.1);
                el.select('text')
                    .transition().duration(150)
                    .style('opacity', isMatch ? 1 : 0.15);
            });
        });

        item.addEventListener('mouseleave', () => {
            item.style.background = 'transparent';
            g.selectAll('.dot').each(function () {
                const el = d3.select(this);
                el.select('circle')
                    .transition().duration(150)
                    .attr('r', dotR)
                    .attr('fill-opacity', 0.85)
                    .attr('stroke-opacity', 0.4);
                el.select('text')
                    .transition().duration(150)
                    .style('opacity', 1);
            });
        });

        legendDiv.appendChild(item);
    });

    container.appendChild(legendDiv);
}

function shortenLabel(model) {
    // Shorten model names for labels
    return model
        .replace('-instruct', '')
        .replace('-v0.1', '')
        .replace('llama-4-maverick-17b-128e', 'llama4-maverick')
        .replace('llama-4-scout-17b-16e', 'llama4-scout')
        .replace('llama-3.1-405b', 'llama3.1-405b')
        .replace('qwen3-coder-480b-a35b', 'qwen3-coder')
        .replace('nemotron-3-nano-30b-a3b', 'nemotron3-nano')
        .replace('nvidia-nemotron-9b', 'nemotron-9b')
        .replace('mixtral-8x22b', 'mixtral-8x22b')
        .replace('kimi-k2-instruct-0905', 'kimi-k2');
}

// Redraw on theme toggle
const _origToggle = typeof toggleMode === 'function' ? toggleMode : null;
function patchToggleForChart() {
    if (typeof window.toggleMode === 'function' && !window._chartPatched) {
        const orig = window.toggleMode;
        window.toggleMode = function () {
            orig.apply(this, arguments);
            // Re-render chart after theme switch
            setTimeout(() => {
                fetch('./model_scores_summary.json')
                    .then(r => r.json())
                    .then(raw => {
                        // Get unique providers
                        const providers = [...new Set(raw.models.map(m => m.provider))];
                        // Create color scale using combined unique D3 palettes (25 distinct colors)
                        const colorScale = d3.scaleOrdinal([...new Set(d3.schemeCategory10.concat(d3.schemeAccent, d3.schemeDark2))]);
                        // Assign colors to providers
                        PROVIDER_COLORS = {};
                        providers.forEach((provider, index) => {
                            PROVIDER_COLORS[provider] = colorScale(index);
                        });
                        drawChart(buildChartData(raw));
                    });
            }, 100);
        };
        window._chartPatched = true;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadLeaderboardChart();
    // Patch theme toggle after all scripts load
    setTimeout(patchToggleForChart, 200);
});
