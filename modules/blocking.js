// Website blocking manager for Focuser extension

export class BlockingManager {
  constructor() {
    this.storageManager = null;
    this.isBlocking = false;
  }

  async ensureStorageManager() {
    if (!this.storageManager) {
      const { StorageManager } = await import('./storage.js');
      this.storageManager = new StorageManager();
    }
  }

  async init() {
    await this.ensureStorageManager();
    
    this.isBlocking = await this.storageManager.getSetting('blockingEnabled');
    await this.updateBlockingRules();
    console.log('Blocking manager initialized, blocking enabled:', this.isBlocking);
  }

  async toggleBlocking() {
    await this.ensureStorageManager();
    
    this.isBlocking = !this.isBlocking;
    await this.storageManager.setSetting('blockingEnabled', this.isBlocking);
    await this.updateBlockingRules();
    
    console.log('Blocking toggled:', this.isBlocking);
    return this.isBlocking;
  }

  async updateBlockedSites(sites) {
    await this.ensureStorageManager();
    
    await this.storageManager.setBlockedSites(sites);
    await this.updateBlockingRules();
    console.log('Blocked sites updated:', sites);
  }

  async updateBlockingRules() {
    await this.ensureStorageManager();
    
    try {
      // Clear existing rules
      const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
      const ruleIds = existingRules.map(rule => rule.id);
      
      if (ruleIds.length > 0) {
        await chrome.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: ruleIds
        });
      }

      // Add new rules if blocking is enabled
      if (this.isBlocking) {
        const blockedSites = await this.storageManager.getBlockedSites();
        const rules = this.createBlockingRules(blockedSites);
        
        if (rules.length > 0) {
          await chrome.declarativeNetRequest.updateDynamicRules({
            addRules: rules
          });
        }
      }
    } catch (error) {
      console.error('Error updating blocking rules:', error);
    }
  }

  createBlockingRules(sites) {
    const rules = [];
    
    sites.forEach((site, index) => {
      // Remove protocol and www if present
      const cleanSite = site.replace(/^https?:\/\//, '').replace(/^www\./, '');
      
      rules.push({
        id: index + 1,
        priority: 1,
        action: {
          type: 'redirect',
          redirect: {
            extensionPath: '/blocked/blocked.html'
          }
        },
        condition: {
          urlFilter: `*://*.${cleanSite}/*`,
          resourceTypes: ['main_frame']
        }
      });

      // Also block without subdomain
      rules.push({
        id: index + 1000,
        priority: 1,
        action: {
          type: 'redirect',
          redirect: {
            extensionPath: '/blocked/blocked.html'
          }
        },
        condition: {
          urlFilter: `*://${cleanSite}/*`,
          resourceTypes: ['main_frame']
        }
      });
    });

    return rules;
  }

  async checkAndBlockUrl(url, tabId) {
    await this.ensureStorageManager();
    
    if (!this.isBlocking) return false;

    const blockedSites = await this.storageManager.getBlockedSites();
    const hostname = new URL(url).hostname.replace(/^www\./, '');

    const isBlocked = blockedSites.some(site => {
      const cleanSite = site.replace(/^https?:\/\//, '').replace(/^www\./, '');
      return hostname.includes(cleanSite);
    });

    if (isBlocked) {
      await this.storageManager.incrementStatistic('sitesBlocked');
      console.log(`Blocked access to: ${url}`);
      return true;
    }

    return false;
  }

  async setupDefaultRules() {
    // This will be called on install to set up default blocking rules
    await this.updateBlockingRules();
  }

  async getStatus() {
    await this.ensureStorageManager();
    
    const blockedSites = await this.storageManager.getBlockedSites();
    return {
      enabled: this.isBlocking,
      blockedSites: blockedSites,
      strictMode: await this.storageManager.getSetting('strictMode')
    };
  }

  async addBlockedSite(site) {
    await this.ensureStorageManager();
    
    const blockedSites = await this.storageManager.getBlockedSites();
    if (!blockedSites.includes(site)) {
      blockedSites.push(site);
      await this.updateBlockedSites(blockedSites);
    }
  }

  async removeBlockedSite(site) {
    await this.ensureStorageManager();
    
    const blockedSites = await this.storageManager.getBlockedSites();
    const index = blockedSites.indexOf(site);
    if (index > -1) {
      blockedSites.splice(index, 1);
      await this.updateBlockedSites(blockedSites);
    }
  }
}
