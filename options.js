// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', async () => {
  const currentShortcutElement = document.getElementById('currentShortcut');
  const shortcutsButton = document.getElementById('shortcutsButton');

  // 获取并显示当前快捷键
  try {
    const commands = await chrome.commands.getAll();
    const switchCommand = commands.find(cmd => cmd.name === 'switch-tab');
    if (switchCommand) {
      currentShortcutElement.textContent = switchCommand.shortcut || '未设置';
    }
  } catch (error) {
    console.error('Error getting shortcuts:', error);
    currentShortcutElement.textContent = '加载失败';
  }

  // 处理快捷键设置按钮点击
  shortcutsButton.addEventListener('click', (e) => {
    e.preventDefault();
    // 尝试打开 Chrome 快捷键设置页面
    chrome.tabs.create({
      url: 'chrome://extensions/shortcuts'
    }).catch(() => {
      // 如果无法直接打开，提示用户手动打开
      alert('请手动在新标签页中输入：chrome://extensions/shortcuts');
    });
  });
});
  
  