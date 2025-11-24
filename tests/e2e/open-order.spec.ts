import { test, expect } from '@playwright/test'
test('fluxo abrir OS pela placa', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Usuário').fill('admin')
  await page.getByLabel('Senha').fill('123')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(/\//)
})
