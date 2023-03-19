// @ts-check
import { test, expect } from '@playwright/test';
import dayjs from 'dayjs';
import twilio from 'twilio';
import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config();
const accountSid = process.env.TTTID;
const authToken = process.env.TTTTOKEN;

const client = twilio(accountSid, authToken);


test('get docktor', async ({ page }) => {
  await page.goto(process.env.LOGIN_URL);

  await page.locator(`a[href="#IdentifyWithPassword"]`).click();
  await page.locator(`#identifyWithPasswordCitizenId`).type(process.env.USERID);
  await page.locator(`#password`).type(process.env.USERPASSWORD);
  await new Promise(res => setTimeout(res, 1000));
  await page.locator(`.validatePassword`).click();
  await new Promise(res => setTimeout(res, 5000));
  await page.goto(process.env.DOCTOR_URL);

  await new Promise(res => setTimeout(res, 3000));
  await page.locator(`.showSearchOnlineAuthntication`).click();

  const text = await page.locator(`[class*="TimeSelect__availableForDateTitleTimeSelect"]`).textContent();
  const firstFreeDate = text.match(/[0-9][0-9]\/[0-9][0-9]\/[0-9][0-9]/)?.at(0)?.trim();

  const currentDate = dayjs(firstFreeDate, "DD/MM/YYYY");

  const now = dayjs();
  const next2Weeks = now.add(2, 'week');
  if (currentDate.isBefore(next2Weeks) && currentDate.isAfter(now)) {
    console.log('The target date is in the next 2 weeks: ', firstFreeDate);
    await client.messages.create({
      from: process.env.TTTTPHONE,
      to: process.env.TTTMYPHONE,
      body: `found appointment at ${firstFreeDate}`
    });
  } else {
    console.log('The target date is not in the next 2 weeks: ', firstFreeDate);
  }

});
