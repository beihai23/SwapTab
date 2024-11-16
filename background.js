let currentTabId = null;
let previousTabId = null;

// 监听标签页激活事件
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  previousTabId = currentTabId;
  currentTabId = activeInfo.tabId;
});

// 监听标签页关闭事件
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === previousTabId) {
    previousTabId = null;
  }
  if (tabId === currentTabId) {
    currentTabId = null;
  }
});

// 处理快捷键命令
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "switch-tab") {
    try {
      // 确保获取当前活动标签
      if (!currentTabId) {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (activeTab) {
          currentTabId = activeTab.id;
        }
      }

      // 验证previousTabId是否有效
      if (previousTabId) {
        const tab = await chrome.tabs.get(previousTabId).catch(() => null);
        if (!tab) {
          previousTabId = null;
        }
      }

      if (!previousTabId) {
        // 首次使用或previousTabId无效时，切换到相邻标签页
        const tabs = await chrome.tabs.query({ currentWindow: true });
        if (tabs.length > 1) { // 确保有多个标签页
          const currentIndex = tabs.findIndex(tab => tab.id === currentTabId);
          if (currentIndex !== -1) {
            // 获取左侧标签，如果当前是第一个标签则获取右侧标签
            const adjacentIndex = currentIndex > 0 ? currentIndex - 1 : currentIndex + 1;
            previousTabId = tabs[adjacentIndex].id;
            await chrome.tabs.update(previousTabId, { active: true });
          }
        }
      } else {
        // 切换到上一个标签页
        await chrome.tabs.update(previousTabId, { active: true });
      }
    } catch (error) {
      console.error('Error switching tabs:', error);
      // 发生错误时重置状态
      previousTabId = null;
      currentTabId = null;
    }
  }
}); 