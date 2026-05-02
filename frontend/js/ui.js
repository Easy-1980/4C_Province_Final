// 词云解析弹窗
window.closeNlpModal = function() {
    document.getElementById('nlp-modal').style.display = 'none';
};
document.getElementById('nlp-modal').addEventListener('click', function(e) {
    if (e.target === this) closeNlpModal();
});

// 弹幕爆点解析弹窗
window.startDanmakuAIAnalysis = function() {
    document.getElementById('ai-analysis-trigger').style.display = 'none';
    document.getElementById('ai-analysis-loading').style.display = 'block';
    
    setTimeout(() => {
        document.getElementById('ai-analysis-loading').style.display = 'none';
        document.getElementById('danmaku-insight').innerText = currentDanmakuAI.insight;
        document.getElementById('danmaku-decision').innerText = currentDanmakuAI.decision;
        document.getElementById('ai-analysis-result').style.display = 'block';
    }, 2500); 
};

window.closeDanmakuModal = function() {
    document.getElementById('danmaku-modal').style.display = 'none';
};
document.getElementById('danmaku-modal').addEventListener('click', function(e) {
    if (e.target === this) closeDanmakuModal();
});

// TGI 画像深度分析弹窗
const tgiTabPanelMap = {
    overview: 'tgi-tab-overview',
    insight: 'tgi-tab-insight',
    advice: 'tgi-tab-advice'
};

let tgiTabsBound = false;
function switchTgiTab(tabKey) {
    const buttons = document.querySelectorAll('#tgi-modal .opera-score-tab-btn[data-tgi-tab]');
    const tabKeys = Object.keys(tgiTabPanelMap);

    tabKeys.forEach(key => {
        const panel = document.getElementById(tgiTabPanelMap[key]);
        const button = Array.from(buttons).find(btn => btn.dataset.tgiTab === key);
        const isActive = key === tabKey;

        if (button) button.classList.toggle('is-active', isActive);
        if (panel) panel.classList.toggle('is-active', isActive);
    });
}

function bindTgiTabs() {
    if (tgiTabsBound) return;
    const buttons = document.querySelectorAll('#tgi-modal .opera-score-tab-btn[data-tgi-tab]');
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            switchTgiTab(this.dataset.tgiTab);
        });
    });
    tgiTabsBound = true;
}

window.openTgiModal = function() {
    const provinceData = globalProvinceData[currentActiveProvince] || {};
    
    if (provinceData && provinceData.tgiData) {
        const tgiDataRaw = provinceData.tgiData || {};
        const tgiData = {
            analysis: String(tgiDataRaw.analysis || '暂无分析'),
            age: tgiDataRaw.age && typeof tgiDataRaw.age === 'object'
                ? tgiDataRaw.age
                : { categories: [], percent: [], tgi: [] },
            gender: tgiDataRaw.gender && typeof tgiDataRaw.gender === 'object'
                ? tgiDataRaw.gender
                : { categories: ['男性', '女性'], percent: [0, 0], tgi: [0, 0] }
        };

        const tgiAnalysisRaw = provinceData.tgiAnalysis && typeof provinceData.tgiAnalysis === 'object'
            ? provinceData.tgiAnalysis
            : {};
        const tgiAnalysis = {
            analysis: String(tgiAnalysisRaw.analysis || tgiData.analysis || '暂无概况'),
            insight: String(tgiAnalysisRaw.insight || '暂无解读'),
            advice: String(tgiAnalysisRaw.advice || '暂无建议')
        };
        
        bindTgiTabs();

        document.getElementById('tgi-modal-title').innerText = currentActiveProvince;
        const overviewPanel = document.getElementById('tgi-tab-overview');
        const insightPanel = document.getElementById('tgi-tab-insight');
        const advicePanel = document.getElementById('tgi-tab-advice');
        if (overviewPanel) overviewPanel.innerText = tgiAnalysis.analysis;
        if (insightPanel) insightPanel.innerText = tgiAnalysis.insight;
        if (advicePanel) advicePanel.innerText = tgiAnalysis.advice;
        switchTgiTab('overview');

        // 显示弹窗
        document.getElementById('tgi-modal').style.display = 'flex';

        // 提取一个通用的双 Y 轴图表配置函数
        const getTgiOption = (dataObj) => ({
            tooltip: { trigger: 'axis', axisPointer: { type: 'cross' }, backgroundColor: 'rgba(6, 13, 31, 0.9)', borderColor: '#00eaff', textStyle: { color: '#fff' } },
            legend: { data: ['占比(%)', 'TGI指数', 'TGI基准线'], top: 0, textStyle: { color: '#a1b0c8' } },
            grid: { top: '20%', right: '12%', bottom: '15%', left: '12%' },
            xAxis: { type: 'category', data: dataObj.categories, axisLabel: { color: '#a1b0c8' }, axisTick: { show: false } },
            yAxis: [
                { type: 'value', name: '占比(%)', nameTextStyle: { color: '#a1b0c8' }, splitLine: { show: false }, axisLabel: { color: '#a1b0c8' } },
                { type: 'value', name: 'TGI', nameTextStyle: { color: '#ffb020' }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } }, axisLabel: { color: '#ffb020' }, min: 0 }
            ],
            series: [
                { name: '占比(%)', type: 'bar', barWidth: '40%', yAxisIndex: 0, itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#00eaff' }, { offset: 1, color: '#0075ff' }]), borderRadius: [4, 4, 0, 0] }, data: dataObj.percent },
                { name: 'TGI指数', type: 'line', yAxisIndex: 1, symbol: 'emptyCircle', symbolSize: 6, itemStyle: { color: '#ffb020' }, lineStyle: { width: 3, shadowBlur: 10, shadowColor: '#ffb020' }, data: dataObj.tgi },
                { name: 'TGI基准线', type: 'line', yAxisIndex: 1, itemStyle: { color: '#ff2277' }, lineStyle: { type: 'dashed', width: 2 }, data: [], markLine: { symbol: ['none', 'none'], data: [{ yAxis: 100 }], lineStyle: { color: '#ff2277', type: 'dashed', width: 2, shadowBlur: 5, shadowColor: '#ff2277' }, label: { show: false } } }
            ]
        });

        // 强制使用 window. 调用跨文件图表实例
        window.myChartTgiAge.setOption(getTgiOption(tgiData.age));
        window.myChartTgiGender.setOption(getTgiOption(tgiData.gender));
        
        setTimeout(() => { 
            window.myChartTgiAge.resize(); 
            window.myChartTgiGender.resize(); 
        }, 100);
    } else {
        alert(`系统正在抓取【${currentActiveProvince}】的深度 TGI 偏好数据，请稍后...`);
    }
};

window.closeTgiModal = function() {
    document.getElementById('tgi-modal').style.display = 'none';
};
document.getElementById('tgi-modal').addEventListener('click', function(e) {
    if (e.target === this) closeTgiModal(); 
});


// 左上角剧种名录弹窗
window.closeOperaListModal = function() {
    document.getElementById('opera-list-modal').style.display = 'none';
    if (typeof window.resetOperaArchiveSearch === 'function') {
        window.resetOperaArchiveSearch();
    }
};
document.getElementById('opera-list-modal').addEventListener('click', function(e) {
    if (e.target === this) closeOperaListModal(); 
});

// 全国热度排行榜 点击弹窗 (剧种数量与评分)
window.closeOperaScoreModal = function() {
    const modal = document.getElementById('opera-score-modal');
    if (modal) modal.style.display = 'none';
};

// 点击弹窗背景也可关闭
const operaScoreModalElement = document.getElementById('opera-score-modal');
if (operaScoreModalElement) {
    operaScoreModalElement.addEventListener('click', function(e) {
        if (e.target === this) closeOperaScoreModal();
    });
}

const operaScoreTabPanelMap = {
    analysis: 'opera-score-tab-analysis',
    examples: 'opera-score-tab-examples',
    advice: 'opera-score-tab-advice'
};

let operaScoreTabsBound = false;
function switchOperaScoreTab(tabKey) {
    const buttons = document.querySelectorAll('#opera-score-modal .opera-score-tab-btn');
    const tabKeys = Object.keys(operaScoreTabPanelMap);

    tabKeys.forEach(key => {
        const panel = document.getElementById(operaScoreTabPanelMap[key]);
        const button = Array.from(buttons).find(btn => btn.dataset.tab === key);
        const isActive = key === tabKey;

        if (button) button.classList.toggle('is-active', isActive);
        if (panel) {
            panel.classList.toggle('is-active', isActive);
        }
    });
}

function bindOperaScoreTabs() {
    if (operaScoreTabsBound) return;
    const buttons = document.querySelectorAll('#opera-score-modal .opera-score-tab-btn');
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            switchOperaScoreTab(this.dataset.tab);
        });
    });
    operaScoreTabsBound = true;
}

window.openOperaScoreModal = function() {
    const rawNational = (typeof globalDashboardData !== 'undefined' && globalDashboardData.national) ? globalDashboardData.national : {};
    
    // 获取数据源
    const scoreData = (Array.isArray(rawNational.provinceScoreTop10) && rawNational.provinceScoreTop10.length)
        ? rawNational.provinceScoreTop10
        : [];
    const mapData = Array.isArray(rawNational.mapData) ? rawNational.mapData : [];
    
    // 将分值倒序以符合排名（截取Top10）
    const top10 = scoreData
        .slice()
        .sort((a, b) => Number(b && b.avgScore || 0) - Number(a && a.avgScore || 0))
        .slice(0, 10);
    
    const categories = top10.map(item => item.province);
    const avgScores = top10.map(item => Number(item.avgScore || 0));
    // 匹配 mapData 中的各省数量
    const operaCounts = categories.map(prov => {
        const found = mapData.find(d => d.name === prov);
        return found ? Number(found.value) : 0;
    });

    bindOperaScoreTabs();

    // 解析相关AI分析内容（dashboard_data.json -> national.operaCountScoreAI）
    const aiInfo = rawNational.operaCountScoreAI || {};
    const analysisPanel = document.getElementById('opera-score-tab-analysis');
    const examplesPanel = document.getElementById('opera-score-tab-examples');
    const advicePanel = document.getElementById('opera-score-tab-advice');
    if (analysisPanel) analysisPanel.innerText = String(aiInfo.analysis || '暂无数据');
    if (examplesPanel) examplesPanel.innerText = String(aiInfo.examples || '暂无示例');
    if (advicePanel) advicePanel.innerText = String(aiInfo.advice || '暂无建议');
    switchOperaScoreTab('analysis');

    const modal = document.getElementById('opera-score-modal');
    if (modal) {
        modal.style.display = 'flex';
    }

    // 渲染双轴图
    if (window.myChartOperaScore) {
        window.myChartOperaScore.setOption({
            tooltip: { trigger: 'axis', axisPointer: { type: 'cross' }, backgroundColor: 'rgba(6, 13, 31, 0.9)', borderColor: '#00eaff', textStyle: { color: '#fff' } },
            legend: { data: ['剧种数量', '平均评分'], top: 0, textStyle: { color: '#a1b0c8' } },
            grid: { top: '20%', right: '12%', bottom: '15%', left: '12%' },
            xAxis: { type: 'category', data: categories, axisLabel: { color: '#a1b0c8' }, axisTick: { show: false } },
            yAxis: [
                { type: 'value', name: '剧种数量', nameTextStyle: { color: '#a1b0c8' }, splitLine: { show: false }, axisLabel: { color: '#a1b0c8' } },
                { type: 'value', name: '平均评分', nameTextStyle: { color: '#ffb020' }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } }, axisLabel: { color: '#ffb020' } }
            ],
            series: [
                { name: '剧种数量', type: 'bar', barWidth: '40%', yAxisIndex: 0, itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#00eaff' }, { offset: 1, color: '#0075ff' }]), borderRadius: [4, 4, 0, 0] }, data: operaCounts },
                { name: '平均评分', type: 'line', yAxisIndex: 1, symbol: 'emptyCircle', symbolSize: 6, itemStyle: { color: '#ffb020' }, lineStyle: { width: 3, shadowBlur: 10, shadowColor: '#ffb020' }, data: avgScores }
            ]
        });
        
        // 关键交互：抽屉/弹窗打开动画结束后必须执行 resize，避免图表挤压或溢出
        const resizeOperaScoreChart = () => {
            if (window.myChartOperaScore) window.myChartOperaScore.resize();
        };
        resizeOperaScoreChart();
        requestAnimationFrame(() => {
            resizeOperaScoreChart();
            requestAnimationFrame(resizeOperaScoreChart);
        });
        if (modal) {
            modal.addEventListener('transitionend', resizeOperaScoreChart, { once: true });
        }
    }
};

// 数据调度底座：日志轮播 + Tooltip 悬浮联动
document.addEventListener('DOMContentLoaded', function() {
    const scroller = document.querySelector('.hub-scroller');
    const inner = scroller ? scroller.querySelector('.scroller-inner') : null;
    const tooltip = document.getElementById('hub-tooltip');

    if (!scroller || !inner || !tooltip) return;

    const speed = 0.12; // 像素/帧
    let rafId = null;
    let isPlaying = false;
    let offsetY = 0;
    let baseHeight = 0;

    function escapeHtml(text) {
        return String(text == null ? '' : text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function normalizeStatus(status) {
        const s = String(status || '').toLowerCase();
        return s === 'processed' ? 'processed' : 'pending';
    }

    function asNumber(value) {
        const n = Number(value);
        return Number.isFinite(n) ? n : null;
    }

    function fetchJsonWithFallback(paths) {
        return (async function() {
            let lastErr = null;
            for (const path of paths) {
                try {
                    const resp = await fetch(path);
                    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                    return await resp.json();
                } catch (err) {
                    lastErr = err;
                }
            }
            throw lastErr || new Error('JSON 加载失败');
        })();
    }

    function buildVideoMap(videoData) {
        const videos = Array.isArray(videoData && videoData.videos) ? videoData.videos : [];
        const map = new Map();
        videos.forEach(item => {
            if (!item || typeof item !== 'object') return;
            const bvid = String(item.bvid || '').trim();
            if (!bvid || map.has(bvid)) return;
            map.set(bvid, item);
        });
        return map;
    }

    function createLogHtml(task, videoMap) {
        const status = normalizeStatus(task && task.status);
        const label = status === 'processed' ? '已处理' : '待处理';
        const cls = status === 'processed' ? 'processed' : 'pending';
        const opera = String((task && task.opera) || '未知剧种').trim() || '未知剧种';
        const bvid = String((task && task.bvid) || '未知BV').trim() || '未知BV';

        let fullText = `[${label}] ${opera} - ${bvid} (等待进入分析队列)`;
        if (status === 'processed') {
            const video = videoMap.get(bvid) || {};
            const danmakuVal = asNumber(
                video.danmaku
                ?? (video.stats && (video.stats.danmaku ?? video.stats.danmakuCount))
            );
            const spreadHeatVal = asNumber(
                video.spreadHeat
                ?? (video.indexes && video.indexes.spreadHeat)
            );
            const danmakuText = danmakuVal == null ? '--' : `${Math.round(danmakuVal)}`;
            const spreadText = spreadHeatVal == null ? '--' : spreadHeatVal.toFixed(2);
            fullText = `[${label}] ${opera} - ${bvid} (弹幕: ${danmakuText}条 | 传播评分: ${spreadText})`;
        }

        return `<div class="log-item ${cls}" data-fulltext="${escapeHtml(fullText)}"><span>[${label}]</span> ${escapeHtml(opera)} - ${escapeHtml(bvid)} ...</div>`;
    }

    function renderLogItems(tasksData, videoData) {
        const processed = Array.isArray(tasksData && tasksData.processed) ? tasksData.processed : [];
        const unprocessed = Array.isArray(tasksData && tasksData.unprocessed) ? tasksData.unprocessed : [];
        const merged = processed.concat(unprocessed);
        const videoMap = buildVideoMap(videoData);

        // 打散顺序：避免前端固定先显示“已处理”再“待处理”
        for (let i = merged.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = merged[i];
            merged[i] = merged[j];
            merged[j] = temp;
        }

        const html = merged.map(task => createLogHtml(task, videoMap)).join('');
        inner.innerHTML = html || '<div class="log-item pending" data-fulltext="暂无调度日志"><span>[待处理]</span> 暂无调度日志</div>';
    }

    function renderOffset() {
        inner.style.transform = `translateY(-${offsetY}px)`;
    }

    function loop() {
        if (!isPlaying) return;
        offsetY += speed;
        if (offsetY >= baseHeight) {
            offsetY = 0;
        }
        renderOffset();
        rafId = requestAnimationFrame(loop);
    }

    function play() {
        if (isPlaying || baseHeight <= 0) return;
        isPlaying = true;
        rafId = requestAnimationFrame(loop);
    }

    function pause() {
        isPlaying = false;
        if (rafId != null) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
    }

    function setupSeamlessLoop() {
        pause();
        offsetY = 0;
        baseHeight = 0;
        inner.style.transform = 'translateY(0)';

        const originalItems = Array.from(inner.querySelectorAll('.log-item'));
        if (originalItems.length <= 1) return;

        baseHeight = originalItems.reduce((sum, item) => sum + item.offsetHeight, 0);
        if (baseHeight <= 0) {
            baseHeight = originalItems.length * 28;
        }

        const frag = document.createDocumentFragment();
        originalItems.forEach(item => {
            frag.appendChild(item.cloneNode(true));
        });
        inner.appendChild(frag);
    }

    // 对外暴露控制函数（兼容旧命名）
    window.play = play;
    window.pause = pause;
    window.startTicker = play;
    window.stopTicker = pause;

    // 事件委托：鼠标移入日志项 -> 展示 Tooltip + 暂停轮播
    scroller.addEventListener('mouseover', function(e) {
        const item = e.target.closest('.log-item');
        if (!item || !scroller.contains(item)) return;
        if (e.relatedTarget && item.contains(e.relatedTarget)) return;

        tooltip.textContent = item.getAttribute('data-fulltext') || item.textContent || '';
        tooltip.classList.add('show');
        pause();
    });

    // 事件委托：鼠标移出日志项 -> 隐藏 Tooltip + 恢复轮播
    scroller.addEventListener('mouseout', function(e) {
        const item = e.target.closest('.log-item');
        if (!item || !scroller.contains(item)) return;
        if (e.relatedTarget && item.contains(e.relatedTarget)) return;

        tooltip.classList.remove('show');
        play();
    });

    (async function initHubLogs() {
        try {
            const [tasksData, videoData] = await Promise.all([
                fetchJsonWithFallback([
                    'data/bilibili_tasks.json',
                    '../data/bilibili_tasks.json'
                ]),
                fetchJsonWithFallback([
                    'data/video_analysis.json',
                    '../data/video_analysis.json'
                ])
            ]);

            renderLogItems(tasksData, videoData);
            setupSeamlessLoop();
            play();
        } catch (err) {
            pause();
            inner.innerHTML = '<div class="log-item pending" data-fulltext="日志加载失败，请检查数据文件路径"><span>[待处理]</span> 日志加载失败，请检查数据文件路径</div>';
        }
    })();
});

// 全国剧种智能档案馆：全量提取 + 高性能搜索渲染
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('opera-list-modal');
    const inputEl = document.getElementById('opera-search-input');
    const countEl = document.getElementById('opera-count-badge');
    const listEl = document.getElementById('opera-list-body');
    if (!modal || !inputEl || !countEl || !listEl) return;

    const archiveBtn = Array.from(document.querySelectorAll('.hub-buttons .hub-btn'))
        .find(btn => (btn.textContent || '').includes('剧种档案'));

    let allOperas = [];
    let debounceTimer = null;

    function fetchJsonWithFallback(paths) {
        return (async function() {
            let lastErr = null;
            for (const path of paths) {
                try {
                    const resp = await fetch(path);
                    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                    return await resp.json();
                } catch (err) {
                    lastErr = err;
                }
            }
            throw lastErr || new Error('JSON 加载失败');
        })();
    }

    function expandLabels(countMap) {
        const result = [];
        const obj = countMap && typeof countMap === 'object' ? countMap : {};
        Object.keys(obj).forEach(label => {
            const count = Math.max(0, Math.floor(Number(obj[label]) || 0));
            for (let i = 0; i < count; i += 1) result.push(label);
        });
        return result;
    }

    function escapeHtml(text) {
        return String(text == null ? '' : text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function buildAllOperas(dashboardData) {
    const provinces = dashboardData && dashboardData.provinces && typeof dashboardData.provinces === 'object'
        ? dashboardData.provinces
        : {};

    const flat = [];

    Object.keys(provinces).forEach(provinceName => {
        const raw = provinces[provinceName] && typeof provinces[provinceName] === 'object'
            ? provinces[provinceName]
            : {};

        const rawOperas = Array.isArray(raw.operas) ? raw.operas : [];

        const dynastyPool = expandLabels(raw.originDynasty);
        const levelPool = expandLabels(raw.heritageLevel);

        rawOperas.forEach((op, idx) => {
            let name = '';
            let dynasty = '';
            let level = '';

            if (op && typeof op === 'object') {
                name = String(op.name || '').trim();
                dynasty = String(op.dynasty || op.originDynasty || '未知').trim();
                level = String(op.level || op.heritageLevel || '未计入').trim();
            } else {
                name = String(op || '').trim();
                dynasty = dynastyPool.length ? dynastyPool[idx % dynastyPool.length] : '未知';
                level = levelPool.length ? levelPool[idx % levelPool.length] : '未计入';
            }

            if (!name) return;

            const searchKey = `${name} ${dynasty} ${level} ${provinceName}`.toLowerCase();

            flat.push({
                name,
                dynasty,
                level,
                searchKey,
                province: provinceName
            });
        });
    });

    return flat;
}

    function renderOperaList(data) {
        if (!Array.isArray(data) || data.length === 0) {
            listEl.innerHTML = '<div class="opera-list-item"><div class="opera-name" style="font-size:15px; color:#a1b0c8; font-weight:normal;">未找到相关剧种</div></div>';
            countEl.textContent = '(共 0 个)';
            return;
        }

        const html = data.map((item, idx) => `
            <div class="opera-list-item">
                <div class="opera-list-left">
                    <span class="opera-index">${idx + 1}</span>
                    <span class="opera-name">${escapeHtml(item.name)}</span>
                    <span class="opera-time">(${escapeHtml(item.dynasty)})</span>
                </div>
                <div class="opera-list-right" style="color:#ff2277; border-color:#ff2277;">
                    ${escapeHtml(item.level)}非遗
                </div>
            </div>
        `).join('');

        listEl.innerHTML = html;
        countEl.textContent = `(共 ${data.length} 个)`;
    }

    function doFilter() {
        const kw = inputEl.value.trim().toLowerCase();
        if (!kw) {
            renderOperaList(allOperas);
            return;
        }
        const filtered = allOperas.filter(item => item.searchKey.includes(kw));
        renderOperaList(filtered);
    }

    function handleSearch() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(doFilter, 120);
    }

    window.handleOperaSearch = handleSearch;

    function openOperaArchiveModal() {
        modal.style.display = 'flex';
        inputEl.value = '';
        renderOperaList(allOperas);
        listEl.scrollTop = 0;
        setTimeout(() => inputEl.focus(), 0);
    }

    window.resetOperaArchiveSearch = function() {
        inputEl.value = '';
        renderOperaList(allOperas);
        listEl.scrollTop = 0;
    };

    if (archiveBtn) {
        archiveBtn.addEventListener('click', openOperaArchiveModal);
    }

    fetchJsonWithFallback([
        'data/dashboard_data.json',
        '../data/dashboard_data.json'
    ]).then(dashboardData => {
        allOperas = buildAllOperas(dashboardData);
        window.allOperas = allOperas;
        renderOperaList(allOperas);
    }).catch(() => {
        allOperas = [];
        window.allOperas = allOperas;
        renderOperaList(allOperas);
    });
});

// 数据链路终端：异步流水日志模拟
document.addEventListener('DOMContentLoaded', function() {
    const linkModal = document.getElementById('link-modal');
    const terminalOutput = document.getElementById('terminal-output');
    const terminalBody = linkModal ? linkModal.querySelector('.terminal-body') : null;
    const linkBtn = document.querySelector('.hub-buttons .hub-btn.accent');
    if (!linkModal || !terminalOutput || !terminalBody || !linkBtn) return;

    const videos = [
        { bvid: 'BV1p44y1s7z1', opera: '京剧', view: 3433607, like: 351073, coin: 254813, favorite: 93061, danmaku: 7329, spreadHeat: 95.5, interactionQuality: 44.3, score: 75.0, spreadLevel: '强传播' },
        { bvid: 'BV1Vs41117yJ', opera: '豫剧', view: 308985, like: 2427, coin: 673, favorite: 3813, danmaku: 1902, spreadHeat: 65.7, interactionQuality: 9.2, score: 43.1, spreadLevel: '强传播' },
        { bvid: 'BV11f421v74w', opera: '川剧', view: 59060, like: 2508, coin: 1802, favorite: 3107, danmaku: 1920, spreadHeat: 61.4, interactionQuality: 50.1, score: 56.9, spreadLevel: '强传播' }
    ];
    const cnNums = ['一', '二', '三'];
    let runId = 0;

    async function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function printLog(type, content) {
        const line = document.createElement('div');
        if (type === 'failure') {
            line.className = 'log-line';
            line.innerHTML = `<span class="tag-failure" style="color:#ff4d4f; font-weight:bold;">[Failure]</span> <span style="color:#ff4d4f;">${content}</span>`;
        } else {
            line.className = 'log-line';
            line.innerHTML = `<span class="tag-success" style="color:#00ffaa; font-weight:bold;">[Success]</span> <span style="color:#a1b0c8;">${content}</span>`;
        }
        terminalOutput.appendChild(line);
        terminalBody.scrollTop = terminalBody.scrollHeight;
    }

    function printDivider() {
        terminalOutput.insertAdjacentHTML('beforeend', '<div class="log-line" style="color:#5c6e8a;">--------------------------------------------------</div>');
        terminalBody.scrollTop = terminalBody.scrollHeight;
    }

    function resetTerminal() {
        terminalOutput.innerHTML = '';
    }

    async function runPipeline() {
        const myRunId = ++runId;
        resetTerminal();
        printLog('success', '读取“bilibili_tasks.xlsx”成功，现开始读取视频BV号');

        for (let i = 0; i < videos.length; i += 1) {
            if (myRunId !== runId) return;
            const v = videos[i];
            const num = cnNums[i] || String(i + 1);

            await delay(800);
            if (myRunId !== runId) return;
            printLog('success', `开始提取第${num}条视频相关信息：${v.bvid} ${v.opera}`);

            await delay(1200);
            if (myRunId !== runId) return;
            printLog('success', `成功提取 ${v.bvid}。播放量：${v.view} 点赞数：${v.like} 投币数：${v.coin} 收藏数：${v.favorite} 弹幕数：${v.danmaku}`);

            await delay(1000);
            if (myRunId !== runId) return;
            printLog('success', '进行NLP语义提取，各项综合指标计算，高能弹幕提取');

            await delay(1500);
            if (myRunId !== runId) return;
            printLog('success', `传播热度：${v.spreadHeat} 互动质量：${v.interactionQuality} 综合评分：${v.score} 类型：${v.spreadLevel}，高能弹幕、高频词提取成功`);

            await delay(800);
            if (myRunId !== runId) return;
            printLog('success', '调用 Qwen 分析。成功读取 .env 中 API-KEY，尝试调用 Qwen');

            const failCount = Math.floor(Math.random() * 3);
            if (failCount >= 1) {
                await delay(1500);
                if (myRunId !== runId) return;
                printLog('failure', '第一次调用，尝试再次调用');
            }
            if (failCount === 2) {
                await delay(1500);
                if (myRunId !== runId) return;
                printLog('failure', '第二次调用，尝试再次调用。若三次均调用失败，则退出进程');
            }

            await delay(2000);
            if (myRunId !== runId) return;
            printLog('success', 'Qwen Success');

            await delay(500);
            if (myRunId !== runId) return;
            printLog('success', '输出Qwen 分析 JSON 数据，供前端调用');

            await delay(300);
            if (myRunId !== runId) return;
            printDivider();

            await delay(500);
        }
    }

    window.closeLinkModal = function() {
        runId += 1;
        linkModal.style.display = 'none';
    };

    linkModal.addEventListener('click', function(e) {
        if (e.target === this) window.closeLinkModal();
    });

    linkBtn.addEventListener('click', function() {
        linkModal.style.display = 'flex';
        runPipeline();
    });
});

// 热门视频卡片：异步加载 + Top3 切换
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('video-card-modal');
    const openBtn = Array.from(document.querySelectorAll('.hub-buttons .hub-btn'))
        .find(btn => (btn.textContent || '').includes('热门视频卡片'));
    const nextBtn = document.getElementById('next-video-btn');

    const refs = {
        cover: document.getElementById('vc-cover'),
        title: document.getElementById('vc-title'),
        bvid: document.getElementById('vc-bvid'),
        views: document.getElementById('vc-views'),
        likes: document.getElementById('vc-likes'),
        coins: document.getElementById('vc-coins'),
        favs: document.getElementById('vc-favs'),
        tagContainer: document.getElementById('vc-tag-container'),
        heat: document.getElementById('vc-heat'),
        interact: document.getElementById('vc-interact'),
        score: document.getElementById('vc-score'),
        level: document.getElementById('vc-level'),
        insight: document.getElementById('vc-insight')
    };

    const requiredRefs = [
        refs.cover,
        refs.title,
        refs.bvid,
        refs.views,
        refs.likes,
        refs.coins,
        refs.favs,
        refs.tagContainer
    ];
    if (!modal || !openBtn || !nextBtn || requiredRefs.some(v => !v)) return;

    let topVideos = [];
    let currentIndex = 0;
    let currentBvid = '';

    function formatNumber(num) {
        const n = Number(num) || 0;
        return n >= 10000 ? `${(n / 10000).toFixed(1)}W` : `${Math.round(n)}`;
    }

    function normalizeVideo(item) {
        const stats = item && typeof item.stats === 'object' ? item.stats : {};
        const indexes = item && typeof item.indexes === 'object' ? item.indexes : {};
        return {
            bvid: String((item && item.bvid) || ''),
            title: String((item && item.title) || '未知标题'),
            views: Number((item && item.views) ?? stats.view ?? item.view ?? 0),
            likes: Number((item && item.likes) ?? stats.like ?? item.like ?? 0),
            coins: Number((item && item.coins) ?? stats.coin ?? item.coin ?? 0),
            favs: Number((item && item.favs) ?? stats.favorite ?? item.favorite ?? 0),
            tags: (() => {
                if (!item) return [];
                if (Array.isArray(item.tags)) return item.tags;
                if (typeof item.tags === 'string' && item.tags.trim()) return [item.tags];
                const aiTags = item.aiAnalysis && item.aiAnalysis.tags;
                if (Array.isArray(aiTags)) return aiTags;
                if (typeof aiTags === 'string' && aiTags.trim()) return [aiTags];
                return [];
            })(),
            heat: Number((item && item.heat) ?? indexes.spreadHeat ?? item.spreadHeat ?? 0),
            interact: Number((item && item.interact) ?? indexes.interactionQuality ?? item.interactionQuality ?? 0),
            score: Number((item && item.score) ?? indexes.score ?? 0),
            level: String((item && item.level) ?? indexes.spreadLevel ?? item.spreadLevel ?? '未知'),
            insight: String((item && item.insight) ?? ((item && item.aiAnalysis && item.aiAnalysis.insight) || '暂无洞察'))
        };
    }

    function renderVideoCard(index) {
        const video = topVideos[index];
        if (!video) return;

        currentBvid = video.bvid;
        refs.cover.style.backgroundImage = `url('images/covers/${video.bvid}.webp')`;
        refs.title.textContent = video.title;
        refs.bvid.textContent = video.bvid;
        refs.views.textContent = formatNumber(video.views);
        refs.likes.textContent = formatNumber(video.likes);
        refs.coins.textContent = formatNumber(video.coins);
        refs.favs.textContent = formatNumber(video.favs);
        if (refs.heat) refs.heat.textContent = video.heat.toFixed(1);
        if (refs.interact) refs.interact.textContent = video.interact.toFixed(1);
        if (refs.score) refs.score.textContent = video.score.toFixed(1);
        if (refs.level) refs.level.textContent = video.level;
        if (refs.insight) refs.insight.textContent = video.insight;

        const tagContainer = document.getElementById('vc-tag-container');
        if (tagContainer) {
            tagContainer.innerHTML = '';
            const tags = Array.isArray(video.tags) ? video.tags : [];
            tags.forEach(tagText => {
                const tagSpan = document.createElement('span');
                tagSpan.className = 'tag';
                tagSpan.textContent = String(tagText);
                tagSpan.style.cssText = "background: rgba(0,234,255,0.1); border: 1px solid #00eaff; color: #00eaff; padding: 3px 8px; border-radius: 4px; font-size: 12px;";
                tagContainer.appendChild(tagSpan);
            });
        }
    }

    async function loadTopVideos() {
        try {
            const resp = await fetch('data/video_analysis.json');
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const json = await resp.json();
            const raw = json && json.representativeVideos;
            const list = Array.isArray(raw)
                ? raw
                : (raw && typeof raw === 'object' ? Object.values(raw) : []);

            topVideos = list
                .map(normalizeVideo)
                .sort((a, b) => b.score - a.score)
                .slice(0, 3);

            currentIndex = 0;
            renderVideoCard(currentIndex);
        } catch (err) {
            console.error('热门视频卡片数据加载失败:', err);
        }
    }

    window.closeVideoCardModal = function() {
        modal.style.display = 'none';
    };

    modal.addEventListener('click', function(e) {
        if (e.target === this) window.closeVideoCardModal();
    });

    nextBtn.addEventListener('click', function() {
        if (!topVideos.length) return;
        currentIndex = (currentIndex + 1) % topVideos.length;
        renderVideoCard(currentIndex);
    });

    refs.bvid.addEventListener('click', function(event) {
        if (!currentBvid) return;
        if (event.button !== 0) return;
        window.open(`https://www.bilibili.com/video/${currentBvid}`, '_blank');
    });

    openBtn.addEventListener('click', async function() {
        modal.style.display = 'flex';
        if (!topVideos.length) {
            await loadTopVideos();
        } else {
            renderVideoCard(currentIndex);
        }
    });

    loadTopVideos();
});
