(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const examples = () => [{x:1,y:40},{x:2,y:49},{x:3,y:59},{x:4,y:66},{x:5,y:76}];
  let data = examples(), fitted = null, w = 0, b = 0, epoch = 0, history = [], timer = null, updateText = '학습을 시작하면 수정량을 보여줘요.';
  try { const saved = JSON.parse(localStorage.getItem('ain-ml-data')); if (Array.isArray(saved) && saved.length <= 500 && saved.every(p => Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= 0 && p.x <= 24 && p.y >= 0 && p.y <= 100)) data = saved; } catch {}
  const fmt = n => Number.isFinite(n) ? n.toFixed(3) : '—';
  const loss = () => data.length ? data.reduce((s,p) => s + (w*p.x+b-p.y)**2,0)/data.length : 0;
  const identifiable = () => data.length >= 2 && data.some(p => p.x !== data[0].x);
  function graph(id, model) {
    const maxX = Math.max(8,...data.map(p=>p.x),Number($('predictHours').value)||0), X = x => 52+x/maxX*560, Y = y => 300-y/100*265;
    let s = '<defs><clipPath id="clip-'+id+'"><rect x="52" y="20" width="560" height="280"/></clipPath></defs>';
    for (let i=0;i<=5;i++) { const y=i*20,x=i*maxX/5;s+=`<path d="M52 ${Y(y)}H612 M${X(x)} 35V300" stroke="#e3ebf5"/><text x="42" y="${Y(y)+4}" text-anchor="end">${y}</text><text x="${X(x)}" y="320" text-anchor="middle">${x.toFixed(1)}</text>`; }
    s+='<text x="12" y="19">점수</text><text x="565" y="343">공부 시간 (h)</text><g clip-path="url(#clip-'+id+')">';
    if(model) s+=`<line x1="${X(0)}" y1="${Y(model.b)}" x2="${X(maxX)}" y2="${Y(model.w*maxX+model.b)}" stroke="#16a08b" stroke-width="3"/>`;
    data.forEach(p => {s+=`<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="5" fill="#287bd0" stroke="white" stroke-width="2"><title>${p.x}시간 · ${p.y}점</title></circle>`;});
    $(id).innerHTML=s+'</g>';
  }
  function lossGraph(){
    const max=Math.max(1,...history.map(p=>p.y)), end=Math.max(10,epoch),X=x=>55+x/end*550,Y=y=>295-y/max*255;
    let s='';for(let i=0;i<=4;i++){const y=max*i/4;s+=`<path d="M55 ${Y(y)}H605" stroke="#e3ebf5"/><text x="48" y="${Y(y)+4}" text-anchor="end">${y.toFixed(0)}</text>`;}
    s+=`<polyline points="${history.map(p=>`${X(p.x)},${Y(p.y)}`).join(' ')}" fill="none" stroke="#1769c5" stroke-width="3"/><text x="55" y="320">0</text><text x="580" y="320">${end}</text><text x="10" y="20">MSE</text><text x="540" y="343">반복 횟수</text>`;$('lossGraph').innerHTML=s;
  }
  function renderTraining(){
    $('epoch').textContent=epoch;$('weight').textContent=fmt(w);$('bias').textContent=fmt(b);$('loss').textContent=data.length?fmt(loss()):'—';graph('trainingGraph',{w,b});lossGraph();
    const p=data[0];$('stepData').textContent=p?`${data.length}개 중 첫 데이터: x = ${p.x}시간, 정답 y = ${p.y}점`:'위에서 데이터를 추가해 주세요.';
    $('stepPredict').textContent=p?`${fmt(w)} × ${p.x} + ${fmt(b)} = ${fmt(w*p.x+b)}점`:'입력 대기';
    $('stepLoss').textContent=p?`첫 오차² = ${fmt((w*p.x+b-p.y)**2)} / 전체 MSE = ${fmt(loss())}`:'정답 대기';$('stepUpdate').textContent=updateText;
  }
  function stop(message){if(timer!==null)clearTimeout(timer);timer=null;$('start').disabled=false;$('pause').disabled=true;if(message)$('trainingStatus').textContent=message;}
  function reset(){stop();w=0;b=0;epoch=0;history=data.length?[{x:0,y:loss()}]:[];updateText='학습을 시작하면 수정량을 보여줘요.';$('trainingStatus').textContent='학습 준비 · 초기 가중치와 편향은 0이에요.';renderTraining();}
  function changed(){reset();fitted=null;$('prediction').textContent='데이터가 바뀌었어요. 다시 학습해 주세요.';$('fitFormula').textContent='학습 전 · 새 데이터로 학습해 주세요.';$('dataMessage').textContent='변경한 데이터가 03-2에도 반영됐어요.';try{localStorage.setItem('ain-ml-data',JSON.stringify(data));}catch{}renderData();}
  function renderData(){ $('count').textContent=`(${data.length}개)`;$('dataRows').innerHTML=data.map((p,i)=>`<tr><td>${p.x} h</td><td>${p.y}점</td><td><button type="button" data-index="${i}" aria-label="${i+1}번째 데이터 삭제">×</button></td></tr>`).join('');graph('patternGraph',fitted); }
  $('dataForm').addEventListener('submit',e=>{e.preventDefault();if(data.length>=500){$('dataMessage').textContent='데이터는 최대 500개까지 추가할 수 있어요.';return;}const x=Number($('hours').value),y=Number($('score').value);if(!Number.isFinite(x)||!Number.isFinite(y)||x<0||x>24||y<0||y>100)return;data.push({x,y});changed();});
  $('dataRows').addEventListener('click',e=>{const button=e.target.closest('button[data-index]');if(button){data.splice(Number(button.dataset.index),1);changed();}});
  $('example').onclick=()=>{data=examples();changed();};$('clear').onclick=()=>{data=[];changed();};
  function predict(){if(!fitted)return;const x=Number($('predictHours').value);if(!$('predictHours').checkValidity()||!Number.isFinite(x))return;const y=fitted.w*x+fitted.b;const outside=x<Math.min(...data.map(p=>p.x))||x>Math.max(...data.map(p=>p.x));$('prediction').textContent=`예상 ${y.toFixed(1)}점${outside?' · 학습 범위 밖의 예측이에요.':''}${y<0||y>100?' · 점수 범위를 벗어났어요.':''}`;graph('patternGraph',fitted);}
  $('fit').onclick=()=>{if(!identifiable()){$('dataMessage').textContent='서로 다른 공부 시간이 있는 데이터가 2개 이상 필요해요.';return;}const mx=data.reduce((s,p)=>s+p.x,0)/data.length,my=data.reduce((s,p)=>s+p.y,0)/data.length;const slope=data.reduce((s,p)=>s+(p.x-mx)*(p.y-my),0)/data.reduce((s,p)=>s+(p.x-mx)**2,0);fitted={w:slope,b:my-slope*mx};graph('patternGraph',fitted);$('fitFormula').textContent=`예상 점수 = ${fmt(fitted.w)} × 공부 시간 + (${fmt(fitted.b)}) · 최소제곱법으로 학습한 직선`;$('dataMessage').textContent=data.length<4?'학습 완료 · 데이터가 적어 예측이 불안정할 수 있어요.':'학습 완료 · 점을 추가하거나 삭제하며 관계를 비교해 보세요.';predict();};
  $('predictForm').onsubmit=e=>{e.preventDefault();predict();};$('predictHours').oninput=predict;
  function tick(){
    const old=loss(),n=data.length;let dw=0,db=0;data.forEach(p=>{const error=w*p.x+b-p.y;dw+=2*error*p.x/n;db+=2*error/n;});
    // The Hessian's largest eigenvalue is bounded by its trace: 2 * mean(x² + 1).
    // This conservative learning rate keeps every full-batch step stable.
    const rate=.8/(2*data.reduce((s,p)=>s+p.x*p.x+1,0)/n);const deltaW=-rate*dw,deltaB=-rate*db;w+=deltaW;b+=deltaB;epoch++;const current=loss();history.push({x:epoch,y:current});updateText=`학습률 ${rate.toFixed(5)} · Δw = ${fmt(deltaW)}, Δb = ${fmt(deltaB)}`;renderTraining();
    if(Math.abs(old-current)<1e-9){stop(`학습 완료 · ${epoch}회 반복, 최종 MSE ${fmt(current)}. 직선이 데이터에 맞춰졌어요.`);return;}if(epoch>=10000){stop('10,000회 학습 완료 · 최종 직선과 손실을 확인해 주세요.');return;}
    $('trainingStatus').textContent=`학습 중 · ${epoch}회 · 손실 ${fmt(old)} → ${fmt(current)}`;timer=setTimeout(tick,Number($('speed').value));
  }
  $('start').onclick=()=>{if(!identifiable()){$('trainingStatus').textContent='03-1에서 서로 다른 공부 시간의 데이터를 2개 이상 추가해 주세요.';return;}if(epoch>=10000)reset();$('start').disabled=true;$('pause').disabled=false;tick();};$('pause').onclick=()=>stop(`일시정지 · ${epoch}회, MSE ${fmt(loss())}. 현재 직선이 유지돼요. 학습 시작을 누르면 이어서 학습해요.`);$('reset').onclick=reset;
  renderData();reset();
})();
