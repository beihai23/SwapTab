// 当前编辑状态
let isEditing = false;
let currentShortcut = '';

// DOM 元素
const shortcutBox = document.getElementById('shortcutBox');
const editButton = document.getElementById('editButton');
const resetButton = document.getElementById('resetButton');
const errorMessage = document.getElementById('errorMessage');
const conflictModal = document.getElementById('conflictModal');
const conflictDetails = document.getElementById('conflictDetails');
const cancelButton = document.getElementById('cancelButton');
const replaceButton = document.getElementById('replaceButton');

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
  // 获取当前快捷键
  const commands = await chrome.commands.getAll();
  const switchCommand = commands.find(cmd => cmd.name === 'switch-tab');
  const currentShortcut = document.getElementById('currentShortcut');
  
  if (switchCommand && switchCommand.shortcut) {
    // 拆分快捷键并添加样式
    const keys = switchCommand.shortcut.split('+');
    currentShortcut.innerHTML = keys
      .map(key => `<span class="shortcut-key">${key.trim()}</span>`)
      .join('<span class="shortcut-plus">+</span>');
  } else {
    currentShortcut.textContent = '未设置';
  }
});

// 处理快捷键设置按钮点击
document.getElementById('shortcutsButton').addEventListener('click', (e) => {
  e.preventDefault();
  // 尝试打开 Chrome 快捷键设置页面
  chrome.tabs.create({
    url: 'chrome://extensions/shortcuts'
  }).catch(() => {
    // 如果无法直接打开，提示用户手动打开
    alert('请手动在新标签页中输入：chrome://extensions/shortcuts');
  });
});

// 编辑按钮点击事件
editButton.addEventListener('click', () => {
  if (isEditing) {
    stopEditing();
  } else {
    startEditing();
  }
});

// 重置按钮点击事件
resetButton.addEventListener('click', async () => {
  try {
    await chrome.commands.reset('switch-tab');
    const commands = await chrome.commands.getAll();
    const switchCommand = commands.find(cmd => cmd.name === 'switch-tab');
    currentShortcut = switchCommand.shortcut;
    shortcutBox.textContent = currentShortcut;
    errorMessage.textContent = '';
  } catch (error) {
    errorMessage.textContent = '重置失败：' + error.message;
  }
});

// 开始编辑
function startEditing() {
  isEditing = true;
  shortcutBox.classList.add('editing');
  editButton.textContent = '保存';
  shortcutBox.textContent = '请按下新的快捷键组合';
  shortcutBox.focus();
}

// 停止编辑
function stopEditing() {
  isEditing = false;
  shortcutBox.classList.remove('editing');
  editButton.textContent = '修改';
  shortcutBox.textContent = currentShortcut || '未设置';
}

// 处理快捷键输入
shortcutBox.addEventListener('keydown', async (e) => {
  if (!isEditing) return;
  
  e.preventDefault();
  
  // 构建快捷键字符串
  const keys = [];
  if (e.ctrlKey) keys.push('Ctrl');
  if (e.altKey) keys.push('Alt');
  if (e.shiftKey) keys.push('Shift');
  if (e.metaKey) keys.push('Command');
  
  // 添加主键（如果不是修饰键）
  const key = e.key.toUpperCase();
  if (!['CONTROL', 'ALT', 'SHIFT', 'META'].includes(key)) {
    keys.push(key);
  }
  
  const shortcut = keys.join('+');
  
  // 验证快捷键格式
  if (!isValidShortcut(shortcut)) {
    errorMessage.textContent = '无效的快捷键组合';
    return;
  }
  
  // 检查冲突
  const conflicts = await checkShortcutConflicts(shortcut);
  if (conflicts.length > 0) {
    showConflictModal(conflicts, shortcut);
  } else {
    await updateShortcut(shortcut);
  }
});

// 验证快捷键格式
function isValidShortcut(shortcut) {
  // 至少需要一个修饰键（Ctrl、Alt、Shift、Command）和一个主键
  const parts = shortcut.split('+');
  const hasModifier = parts.some(part => ['CTRL', 'ALT', 'SHIFT', 'COMMAND'].includes(part.toUpperCase()));
  const hasMainKey = parts.some(part => !['CTRL', 'ALT', 'SHIFT', 'COMMAND'].includes(part.toUpperCase()));
  return hasModifier && hasMainKey && parts.length >= 2;
}

// 检查快捷键冲突
async function checkShortcutConflicts(shortcut) {
  const commands = await chrome.commands.getAll();
  return commands.filter(cmd => 
    cmd.name !== 'switch-tab' && 
    cmd.shortcut && 
    cmd.shortcut.toLowerCase() === shortcut.toLowerCase()
  );
}

// 显示冲突提示
function showConflictModal(conflicts, newShortcut) {
  conflictDetails.textContent = conflicts.map(cmd => 
    `${cmd.description || cmd.name} (${cmd.shortcut})`
  ).join('\n');
  
  conflictModal.style.display = 'flex';
  
  // 处理冲突弹窗按钮事件
  cancelButton.onclick = () => {
    conflictModal.style.display = 'none';
    stopEditing();
  };
  
  replaceButton.onclick = async () => {
    await updateShortcut(newShortcut);
    conflictModal.style.display = 'none';
  };
}

// 更新快捷键
async function updateShortcut(shortcut) {
  try {
    await chrome.commands.update({
      name: 'switch-tab',
      shortcut: shortcut
    });
    currentShortcut = shortcut;
    errorMessage.textContent = '';
    stopEditing();
  } catch (error) {
    errorMessage.textContent = '更新快捷键失败：' + error.message;
  }
}

// 点击其他地方关闭编辑模式
document.addEventListener('click', (e) => {
  if (isEditing && !shortcutBox.contains(e.target) && !editButton.contains(e.target)) {
    stopEditing();
  }
});

// 预留用于未来添加更多设置选项 