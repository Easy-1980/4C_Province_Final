// 初始化所有图表实例
const myChartLeftTop = echarts.init(document.getElementById('chart-left-top'));
const myChartLeftBottom = echarts.init(document.getElementById('chart-left-bottom'));
const myChartMap = echarts.init(document.getElementById('chart-center-map'));
const myChartRightTop = echarts.init(document.getElementById('chart-right-top'));
const myChartRightBottom = echarts.init(document.getElementById('chart-right-bottom'));
window.myChartTgiAge = echarts.init(document.getElementById('tgi-age-chart'));
window.myChartTgiGender = echarts.init(document.getElementById('tgi-gender-chart'));
window.myChartOperaScore = echarts.init(document.getElementById('modalChart'));

// 省份页左上角 AI 诊断弹窗交互
const aiModalEl = document.getElementById('aiModal');
const aiModalBadgeEl = document.getElementById('aiModalBadge');
const aiAnalysisTextEl = document.getElementById('aiAnalysisText');
const aiAdviceTextEl = document.getElementById('aiAdviceText');
let activeAiModalKey = '';

function isAiModalOpen() {
    return !!(aiModalEl && aiModalEl.classList.contains('show-tooltip'));
}

function closeAiModal() {
    if (!aiModalEl) return;
    aiModalEl.classList.remove('show-tooltip');
    aiModalEl.style.left = '';
    aiModalEl.style.top = '';
    aiModalEl.style.visibility = '';
    activeAiModalKey = '';
}

function positionAiModal(clientX, clientY) {
    if (!aiModalEl) return;
    const gap = 14;
    const margin = 10;
    const modalRect = aiModalEl.getBoundingClientRect();
    let left = clientX + gap;
    let top = clientY + gap;

    // 默认右下，不够空间则智能翻转到左/上
    if (left + modalRect.width + margin > window.innerWidth) {
        left = clientX - modalRect.width - gap;
    }
    if (top + modalRect.height + margin > window.innerHeight) {
        top = clientY - modalRect.height - gap;
    }

    left = Math.max(margin, Math.min(left, window.innerWidth - modalRect.width - margin));
    top = Math.max(margin, Math.min(top, window.innerHeight - modalRect.height - margin));
    aiModalEl.style.left = `${left}px`;
    aiModalEl.style.top = `${top}px`;
}

function toggleAiModalByType(payload, rawEvent) {
    if (!aiModalEl || !payload) return;
    const province = String(payload.province || '').trim();
    const structureType = String(payload.structureType || '待分析').trim();
    const modalKey = `${province}::${structureType}`;

    // 再次点击同一个类型词，关闭弹窗
    if (isAiModalOpen() && activeAiModalKey === modalKey) {
        closeAiModal();
        return;
    }

    const analysisText = String(payload.analysis || '暂无分析');
    const adviceText = String(payload.advice || '暂无建议');
    if (aiModalBadgeEl) aiModalBadgeEl.innerText = `[ ${structureType} ]`;
    if (aiAnalysisTextEl) aiAnalysisTextEl.innerText = analysisText;
    if (aiAdviceTextEl) aiAdviceTextEl.innerText = adviceText;

    aiModalEl.style.visibility = 'hidden';
    aiModalEl.classList.add('show-tooltip');
    activeAiModalKey = modalKey;

    const nativeEvent = rawEvent && rawEvent.event ? rawEvent.event : rawEvent;
    const clientX = Number(nativeEvent && nativeEvent.clientX);
    const clientY = Number(nativeEvent && nativeEvent.clientY);
    const fallbackX = window.innerWidth * 0.5;
    const fallbackY = window.innerHeight * 0.5;
    positionAiModal(
        Number.isFinite(clientX) ? clientX : fallbackX,
        Number.isFinite(clientY) ? clientY : fallbackY
    );
    aiModalEl.style.visibility = 'visible';
}

if (aiModalEl) {
    document.addEventListener('click', function(event) {
        if (!isAiModalOpen()) return;
        if (aiModalEl.contains(event.target)) return;
        closeAiModal();
    });

    window.addEventListener('resize', function() {
        if (isAiModalOpen()) closeAiModal();
    });
}

// 窗口调整大小自适应
window.addEventListener('resize', () => {
    myChartLeftTop.resize(); myChartLeftBottom.resize(); myChartMap.resize(); 
    myChartRightTop.resize(); myChartRightBottom.resize();
    if (window.myChartOperaScore) window.myChartOperaScore.resize(); // 增加针对新图表的适配
});

// 核心更新函数
function updateRightTopChart(provinceName, data) {
    const safeData = data && typeof data === 'object' ? data : {};
    const rawNational = (globalDashboardData && globalDashboardData.national && typeof globalDashboardData.national === 'object')
        ? globalDashboardData.national
        : {};
    const titleEl = document.querySelector('#chart-right-top').previousElementSibling;
    if (provinceName === '全国') {
        titleEl.innerHTML = `${provinceName} 弹幕高频关注点识别 <span style="font-size:10px; color:#ffb020;">(B站抓取)</span>`;
        const rawWordCloud = (Array.isArray(rawNational.wordCloud) && rawNational.wordCloud.length)
            ? rawNational.wordCloud
            : (Array.isArray(safeData.wordCloud) ? safeData.wordCloud : []);
        const wordCloudData = rawWordCloud.map(item => ({
            name: String((item && (item.name || item.word)) || '').trim(),
            value: Number((item && (item.value ?? item.count)) || 0),
            word: String((item && (item.word || item.name)) || '').trim(),
            count: Number((item && (item.count ?? item.value)) || 0),
            sentiment: String((item && item.sentiment) || '中性'),
            analysis: String((item && item.analysis) || '暂无分析'),
            score: String((item && item.score) || '0.00')
        }))
            .filter(item => item.name && item.value > 0)
            .sort((a, b) => b.value - a.value)
            .slice(0, 18);
        myChartRightTop.setOption({
            tooltip: { show: true, trigger: 'item' },
            xAxis: { show: false }, yAxis: { show: false },
            series: [{
                type: 'wordCloud', shape: 'circle', left: 'center', top: 'center', width: '95%', height: '95%',
                sizeRange: [20, 55], rotationRange: [-45, 45], gridSize: 8,
                textStyle: { color: () => 'rgb(' + [Math.round(Math.random() * 150 + 100), Math.round(Math.random() * 150 + 100), 255].join(',') + ')' },
                data: wordCloudData
            }]
        }, true);
    } else {
        titleEl.innerHTML = `${provinceName} 热门视频弹幕高峰识别 <span style="font-size:10px; color:#ffb020;">(B站抓取)</span>`;
        const trendDataRaw = safeData.danmakuTrend && typeof safeData.danmakuTrend === 'object' ? safeData.danmakuTrend : {};
        const fallbackTimes = ['00:00', '00:10', '00:20', '00:30'];
        const rawTimes = Array.isArray(trendDataRaw.times) ? trendDataRaw.times : [];
        const normalizedTimes = rawTimes
            .map(t => String(t || '').trim())
            .filter(Boolean);
        const times = normalizedTimes.length ? normalizedTimes : fallbackTimes;
        const rawCounts = Array.isArray(trendDataRaw.counts) ? trendDataRaw.counts : [];
        const normalizedCounts = rawCounts.map(v => {
            const n = Number(v);
            return Number.isFinite(n) && n >= 0 ? n : 0;
        });
        const counts = times.map((_, idx) => normalizedCounts[idx] ?? 0);
        const trendData = {
            operaName: String(trendDataRaw.operaName || '暂未录入代表剧目'),
            times: times,
            counts: counts
        };
        myChartRightTop.setOption({
            grid: { top: '25%', right: '8%', bottom: '15%', left: '15%' },
            tooltip: {
                trigger: 'axis', backgroundColor: 'rgba(6, 13, 31, 0.9)', borderColor: '#00eaff', textStyle: { color: '#fff', fontSize: 12 },
                formatter: function(params) {
                    return `<div style="font-weight:bold; color:#ffb020; margin-bottom:5px;">${trendData.operaName}</div>
                            时间: ${params[0].name}<br/>
                            弹幕数: <span style="color:#00eaff; font-weight:bold; font-size:16px;">${params[0].value}</span> 条`;
                }
            },
            xAxis: { type: 'category', boundaryGap: false, data: trendData.times, axisLabel: { color: '#a1b0c8', fontSize: 10, maxInterval: 5 }, axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }, axisTick: { show: false } },
            yAxis: { type: 'value', splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)', type: 'dashed' } }, axisLabel: { color: '#a1b0c8', fontSize: 10 } },
            series: [{
                name: '弹幕数', type: 'line', data: trendData.counts, smooth: 0.4, symbol: 'none',
                lineStyle: { color: '#00eaff', width: 2, shadowColor: 'rgba(0, 234, 255, 0.5)', shadowBlur: 10 },
                areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(0, 234, 255, 0.6)' }, { offset: 1, color: 'rgba(0, 234, 255, 0.05)' }]) },
                markPoint: { data: [ { type: 'max', name: 'Max' } ], symbol: 'pin', symbolSize: 40, itemStyle: { color: '#ff2277', shadowBlur: 10, shadowColor: '#ff2277' }, label: { color: '#fff', fontSize: 10 } }
            }]
        }, true);
    }
}

function updateLeftTopChart(provinceName, data) {
     // 1. 在函数首部解除原先的click绑定防止重复注册
    myChartLeftTop.off('click');
    const safeData = data && typeof data === 'object' ? data : {};
    const rawNational = (globalDashboardData && globalDashboardData.national && typeof globalDashboardData.national === 'object')
        ? globalDashboardData.national
        : {};
    const panelTitle = document.querySelector('#chart-left-top').previousElementSibling;
    
    // ======================================
    // 1. 全国页 (保持横向热度排行榜)
    // ======================================
    if (provinceName === '全国') {
        closeAiModal();
        panelTitle.innerText = '全国 综合传播评分 Top 10';

        const scoreData = (Array.isArray(rawNational.provinceScoreTop10) && rawNational.provinceScoreTop10.length)
            ? rawNational.provinceScoreTop10
            : [];
            
        const top10 = scoreData
            .slice()
            .sort((a, b) => Number(b && b.avgScore || 0) - Number(a && a.avgScore || 0))
            .slice(0, 10)
            .sort((a, b) => Number(a && a.avgScore || 0) - Number(b && b.avgScore || 0));

        const topNames = top10.map(item => String(item && item.province || '').trim()).filter(Boolean);
        const topValues = top10
            .filter(item => String(item && item.province || '').trim())
            .map(item => Number(item && item.avgScore || 0));

        myChartLeftTop.setOption({
            grid: { top: '10%', right: '12%', bottom: '10%', left: '15%' },
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
            xAxis: { type: 'value', splitLine: { show: false }, axisLabel: { show: false } },
            yAxis: { type: 'category', data: topNames, axisLabel: { color: '#a1b0c8' }, axisLine: { show: false }, axisTick: { show: false } },
            series: [{
                type: 'bar', data: topValues, label: { show: true, position: 'right', color: '#00eaff', fontSize: 11 },
                itemStyle: { color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [{ offset: 0, color: '#00eaff' }, { offset: 1, color: '#0075ff' }]), borderRadius: [0, 5, 5, 0] }
            }],
            graphic: { elements: [] } // 清除省级页面遗留挂件
        }, true);
        
        // 3. 在 setOption 调用之后追加图表点击事件绑定，呼出弹窗
        myChartLeftTop.on('click', () => {
            if (typeof window.openOperaScoreModal === 'function') {
                window.openOperaScoreModal();
            }
        });

    // ======================================
    // 2. 省份页 (图在上、字在下、重排弱中强)
    // ======================================
    } else {
        panelTitle.innerText = `${provinceName} 地方戏剧传播类型诊断`;
        
        const spreadObj = safeData.spreadStructure && typeof safeData.spreadStructure === 'object' 
            ? safeData.spreadStructure 
            : {};
            
        const operaCount = Number(spreadObj.operaCount || safeData.operaCount || 0);
        const avgScore = Number(spreadObj.avgScore || 0);
        const structureType = String(spreadObj.structureType || '待分析');
        const aiAnalysisObj = spreadObj.aiAnalysis && typeof spreadObj.aiAnalysis === 'object'
            ? spreadObj.aiAnalysis
            : {};
        const aiModalPayload = {
            province: provinceName,
            structureType: structureType,
            analysis: String(aiAnalysisObj.analysis || '暂无分析'),
            advice: String(aiAnalysisObj.advice || '暂无建议')
        };

        // 改为按弱、中等、强的顺序提取数据
        const barsRaw = Array.isArray(spreadObj.bars) ? spreadObj.bars : [];
        const categories = ['弱传播', '中等传播', '强传播']; // 调整了排序
        const counts = categories.map(cat => {
            const match = barsRaw.find(b => b && b.level === cat);
            return match ? Number(match.count || 0) : 0;
        });

        myChartLeftTop.setOption({
            // grid: 图表上移，给底部留出 40% 甚至更多的空间放文字
            grid: { top: '15%', right: '5%', bottom: '35%', left: '5%' },
            tooltip: {
                trigger: 'axis', 
                backgroundColor: 'rgba(6, 13, 31, 0.9)', 
                borderColor: '#00eaff', 
                textStyle: { color: '#fff' }, 
                axisPointer: { type: 'none' },
                formatter: function (params) {
                    const data = params[0];
                    const customMarker = `<span style="display:inline-block; margin-right:8px; border-radius:50%; width:10px; height:10px; background-color:#00eaff; box-shadow:0 0 10px #00eaff;"></span>`;
                    return `<div style="font-weight:bold; margin-bottom:5px; border-bottom: 1px solid rgba(0,234,255,0.3); padding-bottom: 5px;">${data.name}</div>
                            <div style="display:flex; align-items:center;">${customMarker} <span style="color:#a1b0c8;">分布数量：</span><span style="color:#00eaff; font-weight:bold; font-size: 16px; margin-left: 5px;">${data.value}</span></div>`;
                }
            },
            xAxis: { 
                type: 'category', 
                data: categories, 
                axisLabel: { color: '#00eaff', fontSize: 11, interval: 0, margin: 15 }, 
                axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }, 
                axisTick: { show: false } 
            },
            yAxis: { 
                type: 'value', 
                splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)', type: 'dashed' } }, 
                axisLabel: { show: false } 
            },
            series: [
                { 
                    name: '分布数量', 
                    type: 'scatter', 
                    symbol: 'circle', 
                    symbolSize: 12, 
                    data: counts, 
                    itemStyle: { color: '#060d1f', borderColor: '#00eaff', borderWidth: 3, shadowBlur: 12, shadowColor: '#00eaff' }, 
                    label: { show: true, position: 'top', color: '#00eaff', fontSize: 16, fontWeight: 'bold', distance: 10 }, 
                    zlevel: 2 
                },
                { 
                    name: '分布数量', 
                    type: 'bar', 
                    barWidth: 2, 
                    data: counts, 
                    itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#00eaff' }, { offset: 1, color: 'rgba(0, 234, 255, 0)' }]), borderRadius: 2 }, 
                    zlevel: 1 
                }
            ],
            // Graphic 挂件：仿照顶部的数据条样式
            graphic: {
    elements: [
        // ==========================================
        // 元素 1：上方的数据展示（纯展示，不响应点击）
        // ==========================================
        {
            type: 'text',
            left: 'center',
            bottom: '12%', // 把上面这一行往上抬（具体数值可微调，比如 8% 或 10%）
            silent: true, // 禁用点击
            style: {
                text: `{label|剧种数: } {value|${operaCount} 个}          {label|综合评分: } {value|${avgScore.toFixed(1)}}`,
                textAlign: 'center',
                rich: {
                    label: { fill: '#8b9baf', fontSize: 11 },
                    value: { fill: '#00eaff', fontSize: 14 }
                }
            }
        },
        // ==========================================
        // 元素 2：下方的可点击标签（绑定点击事件）
        // ==========================================
        {
            type: 'text',
            id: 'structure-type-tag', // 必须用 id，不能用 name
            left: 'center',
            bottom: '2%', // 👈 乖乖待在最底部
            silent: false, // 允许点击
            style: {
                text: `[ ${structureType} ]`,
                textAlign: 'center',
                fill: '#00eaff',
                fontSize: 14,
                shadowBlur: 10,
                shadowColor: 'rgba(0, 234, 255, 0.4)'
            },
            // 你原本写好的事件拦截和触发逻辑
            onclick: function(evt) {
                if (evt && typeof evt.stop === 'function') evt.stop();
                if (evt) evt.cancelBubble = true;
                toggleAiModalByType(aiModalPayload, evt);
            }
        }
    ]
}
        }, true);
    }
}

function updateRadarChart(provinceName, data) {
    const safeData = data && typeof data === 'object' ? data : {};
    const fallbackDimensions = [
        "服化道审美",
        "二创与整活",
        "名场面打卡",
        "传统文化底蕴",
        "剧情与价值观",
        "唱腔与身段"
    ];
    const radarObj = safeData.radarScores && typeof safeData.radarScores === 'object'
        ? safeData.radarScores
        : {};
    const dimensionsRaw = Array.isArray(radarObj.dimensions) ? radarObj.dimensions : [];
    const normalizedDimensions = dimensionsRaw.map(name => String(name || '').trim()).filter(Boolean);
    const dimensions = normalizedDimensions.length === fallbackDimensions.length
        ? normalizedDimensions
        : fallbackDimensions.slice();

    const scoresRaw = Array.isArray(radarObj.scores)
        ? radarObj.scores
        : (Array.isArray(safeData.radarData) ? safeData.radarData : []);
    const normalizedScores = scoresRaw.map(v => {
        const num = Number(v);
        return Number.isFinite(num) ? Math.max(0, Math.min(100, num)) : 60;
    });
    const radarData = normalizedScores.length === dimensions.length
        ? normalizedScores
        : [60, 60, 60, 60, 60, 60];

    const indicator = dimensions.map(name => ({ name, max: 100 }));
    document.querySelector('#chart-left-bottom').previousElementSibling.innerText = `${provinceName} 代表剧种受众关注画像`;
    myChartLeftBottom.setOption({
        radar: { indicator: indicator },
        series: [{ type: 'radar', data: [{ value: radarData, name: `${provinceName}受众特征`, itemStyle: { color: '#00eaff', borderColor: '#fff', borderWidth: 1 }, areaStyle: { color: new echarts.graphic.RadialGradient(0.5, 0.5, 1, [{ color: 'rgba(0, 234, 255, 0.1)', offset: 0 }, { color: 'rgba(0, 234, 255, 0.6)', offset: 1 }]) } }] }]
    });
}

function updateBarChart(provinceName, data) {
    const safeData = data && typeof data === 'object' ? data : {};
    const ageGender = safeData.ageGender && typeof safeData.ageGender === 'object'
        ? safeData.ageGender
        : { categories: [], male: [], female: [] };
    const fallbackCategories = ['45岁+', '35-44岁', '26-35岁', '18-25岁'];
    const rawCategories = Array.isArray(ageGender.categories) ? ageGender.categories : [];
    const normalizedCategories = rawCategories.map(v => String(v || '').trim()).filter(Boolean);
    const categories = normalizedCategories.length ? normalizedCategories : fallbackCategories;
    const rawMale = Array.isArray(ageGender.male) ? ageGender.male : [];
    const rawFemale = Array.isArray(ageGender.female) ? ageGender.female : [];
    const male = categories.map((_, idx) => {
        const n = Number(rawMale[idx]);
        return Number.isFinite(n) ? n : 0;
    });
    const female = categories.map((_, idx) => {
        const n = Number(rawFemale[idx]);
        return Number.isFinite(n) ? n : 0;
    });
    document.querySelector('#chart-right-bottom').previousElementSibling.innerHTML = `${provinceName} 代表剧种受众匹配分析 <span style="font-size:10px; color:#ffb020; cursor:pointer;" onclick="window.openTgiModal()">[点击查看TGI详情]</span>`;
    myChartRightBottom.setOption({
        yAxis: { data: categories },
        series: [ { name: '男性', data: male }, { name: '女性', data: female } ]
    });
}

// 地图专属渲染逻辑
function renderMap(geoJson) {
    echarts.registerMap('china', geoJson);
    const mapData = [];     
    globalScatterData = []; 
    let maxOperaCount = 0;
    const nationalData = globalProvinceData['全国'] || {};
    const rawNational = (globalDashboardData && globalDashboardData.national && typeof globalDashboardData.national === 'object')
        ? globalDashboardData.national
        : {};
    const nationalMapData = (Array.isArray(rawNational.mapData) && rawNational.mapData.length)
        ? rawNational.mapData
        : (Array.isArray(nationalData.mapData) ? nationalData.mapData : []);
    const sourceMapData = nationalMapData.length ? nationalMapData : Object.keys(globalProvinceData)
        .filter(name => name !== '全国')
        .map(name => ({ name: name, value: Number(globalProvinceData[name] && globalProvinceData[name].operaCount || 0) }));
    sourceMapData.forEach(item => {
        const shortName = getShortProvinceName(item && item.name);
        if (!shortName) return;
        const count = Number(item && item.value || 0);
        const fullName = getMapFullName(shortName);
        mapData.push({ name: fullName, value: count });
        if (geoCoordMap[shortName]) {
            globalScatterData.push({ name: shortName, value: [...geoCoordMap[shortName], count] });
        }
        if (count > maxOperaCount) maxOperaCount = count;
    });
    const requiredZeroScatterProvinces = ['青海', '西藏', '台湾','香港'];
    const existedScatterNames = new Set(globalScatterData.map(item => item && item.name).filter(Boolean));
    requiredZeroScatterProvinces.forEach(name => {
        if (existedScatterNames.has(name)) return;
        if (!geoCoordMap[name]) return;
        globalScatterData.push({ name: name, value: [...geoCoordMap[name], 0] });
    });
    const heatmapMax = Math.max(10, maxOperaCount);

    const optionMap = {
        visualMap: { show: true, type: 'continuous', min: 0, max: heatmapMax, left: '3%', bottom: '8%', itemWidth: 20, itemHeight: 120, textStyle: { color: '#a1b0c8', fontSize: 12 }, calculable: true, inRange: { color: ['#ffb020', '#ff4d4d', '#ff0000'] }, seriesIndex: 1 },
        tooltip: {
            trigger: 'item', backgroundColor: 'rgba(6, 13, 31, 0.9)', borderColor: '#ffb020', textStyle: { color: '#fff' }, padding: 15,
            formatter: function (params) {
                let shortName = params.name.replace(/省|市|维吾尔自治区|壮族自治区|回族自治区|自治区|特别行政区/g, '');
                const provinceData = globalProvinceData[shortName] || {};
                const operaListRaw = Array.isArray(provinceData.operas) ? provinceData.operas : [];
                const operaList = operaListRaw.map(op => {
                    if (typeof op === 'string') return { name: op, dynasty: '未知', level: '未计入' };
                    return {
                        name: String(op && op.name || '未知剧种'),
                        dynasty: String(op && op.dynasty || '未知'),
                        level: String(op && op.level || '未计入')
                    };
                });
                if (operaList.length === 0) {
                    const count = Number(params.value || provinceData.operaCount || 0);
                    return `<div style="font-size: 16px; color: #ffb020;">${params.name} <br><span style="font-size: 12px; color: #a1b0c8;">剧种数量：${count}</span></div>`;
                }
                let html = `<div style="min-width: 300px;"><div style="font-size: 18px; color: #ffb020; font-weight: bold; border-bottom: 1px solid rgba(255, 176, 32, 0.3); padding-bottom: 10px; margin-bottom: 15px;">${params.name} <span style="font-size: 14px; color: #a1b0c8; font-weight: normal;">| 核心代表剧种</span></div>`;
                operaList.slice(0, 3).forEach((opera, index) => {
                    let levelColor = opera.level.includes('国家') || opera.level.includes('世界') ? '#ff2277' : '#ffb020';
                    html += `<div style="display: flex; align-items: center; margin-bottom: 12px; width: 100%;">
                                <div style="width: 22px; height: 22px; background: #ff4d4d; color: #fff; text-align: center; line-height: 22px; border-radius: 50%; font-size: 12px; margin-right: 10px; flex-shrink: 0;">${index + 1}</div>
                                <div style="color: #fff; font-size: 15px; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex-shrink: 1;" title="${opera.name}">${opera.name}</div>
                                <div style="color: #6a7b9d; font-size: 13px; margin-left: 8px; margin-right: auto; white-space: nowrap; flex-shrink: 0;">(${opera.dynasty})</div>
                                <div style="border: 1px solid ${levelColor}; color: ${levelColor}; padding: 2px 6px; border-radius: 4px; font-size: 12px; white-space: nowrap; flex-shrink: 0; margin-left: 15px;">${opera.level}非遗</div>
                            </div>`;
                });
                if (operaList.length > 3) html += `<div style="color: #a1b0c8; font-size: 12px; text-align: center; margin-top: 10px; border-top: 1px dashed rgba(161, 176, 200, 0.3); padding-top: 10px;">(仅展示前 3 个代表剧种)</div>`;
                html += `</div>`;
                return html;
            }
        },
        geo: {
            map: 'china', roam: true, boundingCoords: [ [73.0, 54.0], [135.0, 15.0] ], zoom: 1.2, scaleLimit: { min: 1, max: 5 },
            itemStyle: { areaColor: 'rgba(0, 234, 255, 0.05)', borderColor: 'rgba(0, 234, 255, 0.4)', borderWidth: 1 },
            emphasis: { itemStyle: { areaColor: 'rgba(0, 234, 255, 0.15)', borderColor: '#00eaff', borderWidth: 1.5 }, label: { show: false, color: '#fff', fontSize: 14, fontWeight: 'bold' } },
            select: {
                itemStyle: { areaColor: 'rgba(63, 191, 202, 0.7)', borderColor: '#fff', borderWidth: 1, shadowBlur: 15, shadowColor: '#00eaff' },
                label: { show: true, color: '#fff', fontSize: 12, fontWeight: 'bold', textBorderColor: 'transparent', textBorderWidth: 0, textShadowBlur: 5, textShadowColor: 'rgba(0, 0, 0, 0.8)' }
            }
        },
        series: [
            { name: '地图触发层', type: 'map', geoIndex: 0, data: mapData, selectedMode: 'single' },
            { name: '剧种点', type: 'effectScatter', coordinateSystem: 'geo', data: globalScatterData, symbolSize: 5, showEffectOn: 'render', 
              rippleEffect: { number: 1, scale: 2, brushType: 'fill', period: 3 },
              label: { show: true, formatter: '{b}', position: 'right', color: '#a1b0c8', fontSize: 11 },
              itemStyle: { shadowBlur: 6, shadowColor: 'rgba(255, 77, 77, 0.8)' },
              emphasis: { scale: true, label: { show: true, color: '#fff', fontWeight: 'bold' } },
              animation: true, animationDuration: 1000, animationEasing: 'cubicOut', animationDelay: idx => idx * 30, animationDurationUpdate: 800, animationEasingUpdate: 'cubicInOut' }
        ]
    };
    myChartMap.setOption(optionMap);
}

// 初始化空图表占位
myChartLeftTop.setOption({ grid: { top: '10%', right: '5%', bottom: '10%', left: '15%' }, xAxis: { type: 'value', splitLine: { show: false }, axisLabel: { color: '#a1b0c8' } }, yAxis: { type: 'category', data: ['广东', '福建', '湖南', '江西', '安徽', '浙江', '陕西', '河南', '江苏', '山西'], axisLabel: { color: '#a1b0c8' } }, series: [{ type: 'bar', data: [12, 15, 18, 20, 22, 25, 28, 32, 35, 42], itemStyle: { color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [{ offset: 0, color: '#00eaff' }, { offset: 1, color: '#0075ff' }]), borderRadius: [0, 5, 5, 0] } }] });
myChartLeftBottom.setOption({ tooltip: { trigger: 'item', backgroundColor: 'rgba(6, 13, 31, 0.9)', borderColor: '#00eaff', borderWidth: 1, textStyle: { color: '#fff', fontSize: 12 } }, radar: { indicator: [ { name: '服化道审美', max: 100 }, { name: '二创与整活', max: 100 }, { name: '名场面打卡', max: 100 }, { name: '传统文化底蕴', max: 100 }, { name: '剧情与价值观', max: 100 }, { name: '唱腔与身段', max: 100 } ], center: ['50%', '55%'], radius: '65%', shape: 'polygon', splitNumber: 4, axisName: { color: '#a1b0c8', fontSize: 11 }, splitLine: { lineStyle: { color: ['rgba(0, 234, 255, 0.6)', 'rgba(0, 234, 255, 0.4)', 'rgba(0, 234, 255, 0.2)', 'rgba(0, 234, 255, 0.1)'].reverse() } }, splitArea: { show: false }, axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.15)' } } }, series: [{ name: '关注度得分', type: 'radar', data: [] }] });
myChartRightBottom.setOption({ tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, backgroundColor: 'rgba(6, 13, 31, 0.8)', borderColor: '#00eaff', textStyle: { color: '#fff', fontSize: 12 }, formatter: function(params) { let html = `<strong>${params[0].name}</strong><br/>`; let total = 0; params.forEach(item => { html += `${item.marker} ${item.seriesName}: ${item.value}%<br/>`; total += item.value; }); return html; } }, legend: { data: ['男性', '女性'], top: '0%', right: '5%', textStyle: { color: '#a1b0c8', fontSize: 11 }, itemWidth: 12, itemHeight: 12, icon: 'roundRect' }, grid: { top: '15%', right: '5%', bottom: '15%', left: '15%' }, xAxis: { type: 'value', max: 50, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)', type: 'dashed' } }, axisLabel: { color: '#a1b0c8', fontSize: 10, formatter: '{value}%' } }, yAxis: { type: 'category', data: ['45岁+', '35-44岁', '26-35岁', '18-25岁'], axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }, axisLabel: { color: '#a1b0c8', fontSize: 11 } }, series: [ { name: '男性', type: 'bar', stack: 'total', barWidth: '40%', itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: '#0075ff' }, { offset: 1, color: '#00eaff' }]) }, data: [] }, { name: '女性', type: 'bar', stack: 'total', itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: '#ff4d8f' }, { offset: 1, color: '#ffb020' }]), borderRadius: [0, 4, 4, 0] }, data: [] } ] });
myChartRightTop.setOption({ tooltip: { show: true }, series: [{ type: 'wordCloud', shape: 'circle', left: 'center', top: 'center', width: '95%', height: '95%', sizeRange: [20, 55], rotationRange: [-45, 45], gridSize: 8, textStyle: { color: () => 'rgb(' + [Math.round(Math.random() * 150 + 100), Math.round(Math.random() * 150 + 100), 255].join(',') + ')' }, data: [] }] });
