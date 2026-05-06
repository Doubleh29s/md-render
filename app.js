marked.setOptions({ 
  breaks: true, 
  gfm: true
});

const state = { content: '', fileName: 'document.md', mode: 'preview' };

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

const dom = {
  landing: $('#landing'),
  contentArea: $('#content-area'),
  dropZone: $('#drop-zone'),
  fileInput: $('#file-input'),
  btnSelect: $('#btn-select'),
  segmentedButton: $('#segmented-button'),
  iconButtonGroup: $('#icon-button-group'),
  metaFileName: $('#meta-filename'),
  metaCharCount: $('#meta-chars'),
  metaLineCount: $('#meta-lines'),
  metaReadTime: $('#meta-time'),
  panelPreview: $('#panel-preview'),
  panelSplit: $('#panel-split'),
  mdPreview: $('#md-preview'),
  mdEditorSplit: $('#md-editor-split'),
  mdPreviewSplit: $('#md-preview-split'),
  btnCopy: $('#btn-copy'),

  btnClear: $('#btn-clear'),
  toast: $('#toast')
};

function cleanMarkdownText(text) {
  if (!text) return '';
  
  // 规范化换行符
  let cleaned = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // 移除不可见控制字符，但保留换行和制表符
  cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // 替换零宽字符为空格
  cleaned = cleaned.replace(/[\u200B-\u200D\uFEFF]/g, '');

  return cleaned;
}

function getClipboardText(e) {
  let text = '';
  const clipboardData = e.clipboardData || window.clipboardData;
  if (!clipboardData) return '';

  const items = Array.from(clipboardData.items);
  
  for (const item of items) {
    if (item.kind === 'file') {
      const file = item.getAsFile();
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          const content = cleanMarkdownText(evt.target.result);
          if (content) {
            loadContent(content, file.name || 'pasted.md');
            showToast('文件已从剪贴板加载');
          }
        };
        reader.readAsText(file);
      }
      return null; // 表示已经处理了文件，不需要继续处理文本
    }
  }
  
  text = clipboardData.getData('text/plain') || '';
  return cleanMarkdownText(text);
}

function showToast(msg) {
  dom.toast.textContent = msg;
  dom.toast.classList.add('show');
  setTimeout(() => dom.toast.classList.remove('show'), 2200);
}

function updateStats() {
  const chars = state.content.length;
  const lines = state.content ? state.content.split('\n').length : 0;
  const minutes = Math.max(1, Math.ceil(chars / 500));
  dom.metaCharCount.textContent = `${chars.toLocaleString()} 字符`;
  dom.metaLineCount.textContent = `${lines} 行`;
  dom.metaReadTime.textContent = `≈ ${minutes} 分钟`;
}

function renderMarkdown(content) {
  try {
    const html = marked.parse(content || '');
    dom.mdPreview.innerHTML = html;
    dom.mdPreviewSplit.innerHTML = html;
  } catch (err) {
    const errorMsg = `<pre style="color:red; padding: 1rem; background: #fff1f0; border: 1px solid #ffa39e; border-radius: 4px;">渲染错误: ${err.message}</pre>`;
    dom.mdPreview.innerHTML = errorMsg;
    dom.mdPreviewSplit.innerHTML = errorMsg;
  }
}

function setMode(mode) {
  if (mode !== 'preview' && mode !== 'split') mode = 'preview';
  state.mode = mode;
  
  $$('.segmented-button-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });
  
  dom.panelPreview.classList.toggle('visible', mode === 'preview');
  dom.panelSplit.classList.toggle('visible', mode === 'split');
  
  if (mode === 'split') { 
    dom.mdEditorSplit.value = state.content; 
    dom.mdEditorSplit.focus(); 
  }
}

function loadContent(content, fileName = 'document.md') {
  state.content = content;
  state.fileName = fileName;
  dom.metaFileName.textContent = fileName;
  
  updateStats();
  renderMarkdown(content);
  
  dom.landing.style.display = 'none';
  dom.contentArea.classList.add('visible');
  dom.segmentedButton.classList.add('visible');
  dom.iconButtonGroup.classList.add('visible');
  
  // 如果当前已经是分屏模式，保持现状，否则切到预览
  if (state.mode !== 'split') {
    setMode('preview');
  } else {
    dom.mdEditorSplit.value = state.content;
  }
}

function clearContent() {
  if (state.content && !confirm('确定要清除当前内容吗？')) return;
  
  state.content = '';
  state.fileName = 'document.md';
  dom.landing.style.display = '';
  dom.contentArea.classList.remove('visible');
  dom.segmentedButton.classList.remove('visible');
  dom.iconButtonGroup.classList.remove('visible');
  dom.mdPreview.innerHTML = '';
  dom.mdEditorSplit.value = '';
  dom.fileInput.value = '';
}

function handleFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const content = cleanMarkdownText(e.target.result || '');
    loadContent(content, file.name);
    showToast('文件已加载');
  };
  reader.onerror = () => showToast('读取文件失败');
  reader.readAsText(file);
}

dom.dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dom.dropZone.classList.add('drag-over'); });
dom.dropZone.addEventListener('dragleave', (e) => { if (!dom.dropZone.contains(e.relatedTarget)) dom.dropZone.classList.remove('drag-over'); });
dom.dropZone.addEventListener('drop', (e) => { e.preventDefault(); dom.dropZone.classList.remove('drag-over'); handleFile(e.dataTransfer.files[0]); });
document.addEventListener('dragover', (e) => e.preventDefault());
document.addEventListener('drop', (e) => {
  e.preventDefault();
  if (!dom.dropZone.contains(e.target) && e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
});

dom.btnSelect.addEventListener('click', (e) => { e.stopPropagation(); dom.fileInput.click(); });
dom.dropZone.addEventListener('click', (e) => { if (e.target !== dom.btnSelect && !dom.btnSelect.contains(e.target)) dom.fileInput.click(); });
dom.fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));

document.addEventListener('paste', (e) => {
  // 如果当前焦点在输入框中，允许默认粘贴行为
  if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') {
    return;
  }

  const text = getClipboardText(e);
  if (text === null) return; // 已处理文件
  
  if (text && text.length > 0) {
    e.preventDefault();
    loadContent(text, 'pasted.md');
    showToast('内容已粘贴');
  }
});

$$('.segmented-button-item').forEach(btn => { 
  btn.addEventListener('click', () => setMode(btn.dataset.mode)); 
});

dom.mdEditorSplit.addEventListener('input', (e) => { 
  state.content = e.target.value; 
  updateStats(); 
  renderMarkdown(state.content); 
});

dom.btnCopy.addEventListener('click', () => { 
  if (!state.content) return; 
  navigator.clipboard.writeText(state.content).then(() => showToast('已复制到剪贴板')); 
});

dom.btnClear.addEventListener('click', () => { 
  clearContent(); 
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && dom.contentArea.classList.contains('visible')) {
    clearContent();
  }
});
