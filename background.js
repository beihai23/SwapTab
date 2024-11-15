let currentTabId = null;
let previousTabId = null;

// 监听标签页激活事件
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  previousTabId = currentTabId;
  currentTabId = activeInfo.tabId;
});

// 处理快捷键命令
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "switch-tab") {
    if (!previousTabId) {
      // 首次使用时，切换到相邻标签页
      const tabs = await chrome.tabs.query({ currentWindow: true });
      const currentIndex = tabs.findIndex(tab => tab.id === currentTabId);
      const adjacentIndex = Math.max(0, currentIndex - 1);
      previousTabId = tabs[adjacentIndex].id;
    }
    
    // 切换到上一个标签页
    if (previousTabId) {
      chrome.tabs.update(previousTabId, { active: true });
    }
  }
}); 