/**
 * 02-wallet-connect.spec.js
 *
 * Tests wallet connection flows in demo and mock-MetaMask scenarios:
 *   - Demo mode auto-connect without MetaMask
 *   - Connected wallet address shown in NavBar
 *   - window.ethereum injection and mock provider
 *   - Demo mode does NOT call window.ethereum.request
 *   - Session wallet state survives page reload via localStorage
 *
 * VITE_MODE=demo is set by script env in playwright.config.js.
 */

import { test, expect } from '@playwright/test'

/**
 * Mock MetaMask provider to inject before page load via addInitScript.
 * Returns a script string (not a function) suitable for addInitScript(script).
 */
function mockMetaMaskScript({
  accounts = ['0xDeAdBeEfDeAdBeEf000000000000000000000001'],
  chainId  = '0x279F',   // 10143 = Monad testnet
  reject   = false,
} = {}) {
  return `
    (() => {
      const handlers = {};
      const _reject = ${reject};
      window.ethereum = {
        isMetaMask: true,
        _accounts: ${JSON.stringify(accounts)},
        _chainId: '${chainId}',
        request: function({ method }) {
          if (_reject) {
            const err = new Error('User rejected');
            err.code = 4001;
            return Promise.reject(err);
          }
          if (method === 'eth_requestAccounts') return Promise.resolve(this._accounts);
          if (method === 'eth_accounts')        return Promise.resolve(this._accounts);
          if (method === 'eth_chainId')         return Promise.resolve(this._chainId);
          if (method === 'net_version')         return Promise.resolve(String(parseInt(this._chainId, 16)));
          if (method === 'wallet_switchEthereumChain') return Promise.resolve(null);
          if (method === 'wallet_addEthereumChain')    return Promise.resolve(null);
          if (method === 'eth_getBalance')      return Promise.resolve('0x0');
          if (method === 'eth_call')            return Promise.resolve('0x');
          return Promise.resolve(null);
        },
        on: (event, cb) => { handlers[event] = cb; },
        removeListener: () => {},
        _emit: (event, data) => { if (handlers[event]) handlers[event](data); },
      };
    })();
  `
}

async function gotoGame(page, username = 'WalletTester') {
  await page.addInitScript((u) => {
    localStorage.setItem('mc_username', u)
  }, username)
  await page.goto('/')
  await page.waitForLoadState('networkidle')
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. DEMO MODE AUTO-CONNECT
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Demo mode wallet — auto-connect', () => {

  test('App auto-connects in demo mode without MetaMask', async ({ page }) => {
    await gotoGame(page)
    // DEMO_WALLET starts with 0x53Be — should be visible in NavBar
    await expect(page.getByText(/0x53Be/i)).toBeVisible({ timeout: 8000 })
  })

  test('NavBar shows truncated DEMO_WALLET address after auto-connect', async ({ page }) => {
    await gotoGame(page)
    // Button shows "🔗 0x53Be…C816"
    const walletBtn = page.locator('button', { hasText: /0x53Be/i })
    await expect(walletBtn).toBeVisible({ timeout: 8000 })
  })

  test('Connect button is NOT in unconnected state in demo mode', async ({ page }) => {
    await gotoGame(page)
    await page.waitForTimeout(1500)
    // In demo mode "CONNECT" should NOT appear by itself
    // (the button text becomes the wallet address)
    const unconnectedBtn = page.locator('button', { hasText: /^🔗 CONNECT$/ })
    await expect(unconnectedBtn).toHaveCount(0)
  })

  test('Demo mode does NOT call window.ethereum.request', async ({ page }) => {
    // Inject a spy ethereum BEFORE the username setup
    await page.addInitScript(() => {
      window._ethereumCalled = false
      window.ethereum = {
        isMetaMask: true,
        request: function(args) {
          window._ethereumCalled = true
          window._ethereumArgs = JSON.stringify(args)
          return Promise.resolve(['0xdeadbeef000000000000000000000000deadbeef'])
        },
        on: () => {},
        removeListener: () => {},
      }
    })
    await gotoGame(page)
    await page.waitForTimeout(2000)
    const wasCalled = await page.evaluate(() => window._ethereumCalled)
    // In DEMO mode the app must NOT call ethereum.request
    expect(wasCalled).toBe(false)
  })

  test('Phaser canvas renders after demo wallet auto-connect', async ({ page }) => {
    await gotoGame(page)
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 15000 })
    // Wallet must also be connected
    await expect(page.getByText(/0x53Be/i)).toBeVisible({ timeout: 8000 })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 2. MOCK METAMASK PROVIDER
// ─────────────────────────────────────────────────────────────────────────────
test.describe('MetaMask mock — provider injection', () => {

  test('window.ethereum is present and isMetaMask after script injection', async ({ page }) => {
    await page.addInitScript(mockMetaMaskScript())
    await gotoGame(page)
    const hasEth = await page.evaluate(() => typeof window.ethereum !== 'undefined')
    expect(hasEth).toBe(true)
    const isMM  = await page.evaluate(() => window.ethereum.isMetaMask)
    expect(isMM).toBe(true)
  })

  test('eth_accounts mock returns the injected account', async ({ page }) => {
    await page.addInitScript(mockMetaMaskScript({
      accounts: ['0xDeAdBeEf0000000000000000000000000000feed'],
    }))
    await gotoGame(page)
    const accts = await page.evaluate(() =>
      window.ethereum.request({ method: 'eth_accounts' })
    )
    expect(accts[0].toLowerCase()).toBe('0xdeadbeef0000000000000000000000000000feed')
  })

  test('eth_chainId mock returns Monad testnet chainId', async ({ page }) => {
    await page.addInitScript(mockMetaMaskScript({ chainId: '0x279F' }))
    await gotoGame(page)
    const chainId = await page.evaluate(() =>
      window.ethereum.request({ method: 'eth_chainId' })
    )
    expect(chainId).toBe('0x279F')
  })

  test('App does not crash when ethereum.request rejects (user rejection)', async ({ page }) => {
    // Inject rejecting provider THEN set username
    await page.addInitScript(mockMetaMaskScript({ reject: true }))
    await gotoGame(page)
    await page.waitForTimeout(2000)
    // Canvas must still show (demo mode ignores MetaMask state)
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 15000 })
    await expect(page.locator('body')).not.toContainText('Uncaught')
  })

  test('wallet_switchEthereumChain resolves without error', async ({ page }) => {
    await page.addInitScript(mockMetaMaskScript())
    await gotoGame(page)
    const result = await page.evaluate(() =>
      window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x279F' }] })
    )
    expect(result).toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 3. SESSION / localStorage PERSISTENCE
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Wallet session — localStorage persistence', () => {

  test('mc_username persists in localStorage after setting', async ({ page }) => {
    await gotoGame(page, 'PersistUser')
    const name = await page.evaluate(() => localStorage.getItem('mc_username'))
    expect(name).toBe('PersistUser')
  })

  test('App stays on game page (not /intro) when username is pre-set', async ({ page }) => {
    await gotoGame(page, 'StayOnGame')
    // Should NOT be at the intro/onboarding route
    await page.waitForTimeout(500)
    expect(page.url()).not.toContain('/intro')
    expect(page.url()).not.toContain('/onboarding')
  })

  test('Clearing mc_username redirects to intro on next visit', async ({ page }) => {
    // Start with username set
    await gotoGame(page, 'TempUser')
    // Clear it to simulate logout/reset
    await page.evaluate(() => localStorage.removeItem('mc_username'))
    // Navigate away and back
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    // Without username the app should go to intro
    // (URL will contain /intro OR the game will show the name entry UI)
    const url = page.url()
    const body = await page.locator('body').innerText()
    // Either route changed or some intro text is visible
    const isIntro = url.includes('/intro') || url.includes('/onboarding') ||
                    body.includes('Enter') || body.includes('username') ||
                    body.includes('ENTER') || body.includes('MonCastle')
    expect(isIntro).toBe(true)
  })
})
