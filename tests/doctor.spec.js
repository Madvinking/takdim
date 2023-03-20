// @ts-check
import { test, expect } from '@playwright/test';
import dayjs from 'dayjs';
import twilio from 'twilio';
import * as dotenv from 'dotenv';
dotenv.config();
const accountSid = process.env.TTTID;
const authToken = process.env.TTTTOKEN;

const client = twilio(accountSid, authToken);

const urls = process.env.DOCTOR_URL?.split(':::') ?? [];

test('get doctor', async ({ page }) => {

  await page.goto(process.env.LOGIN_URL);

  await page.locator(`a[href="#IdentifyWithPassword"]`).click();
  await page.locator(`#identifyWithPasswordCitizenId`).type(process.env.USERID);
  await page.locator(`#password`).type(process.env.USERPASSWORD);

  await page.locator(`.validatePassword`).click();
  await page.getByText('מוצגים עדכונים מחצי השנה האחרונה כולל הודעות שנדרש לאשר').waitFor();


  for (let url of urls) {
    await page.goto(url, { waitUntil: 'networkidle' });
    await Promise.race([
      page.locator(`.showSearchOnlineAuthntication`).click(),
      page.getByText('ביקור רגיל').click().then(() => page.getByText('המשך להצגת תורים פנויים').click()),
      page.locator(`[class*="TimeSelect__availableForDateTitleTimeSelect"]`).waitFor(),
      page.locator(`#availableForDateTitle`).waitFor()
    ]);

    const doctorName = await Promise.race([page.locator(`[class*="DoctorDetails__detailsSection"]`).textContent(),
    page.locator(`[class*="docPropTitle"]`).textContent()
    ]);

    const text = await Promise.race([
      page.locator(`[class*="TimeSelect__availableForDateTitleTimeSelect"]`).textContent(),
      page.locator(`#availableForDateTitle`).textContent()
    ]);
    const firstFreeDate = text.match(/[0-9][0-9]\/[0-9][0-9]\/[0-9][0-9]/)?.at(0)?.trim();

    const currentDate = dayjs(firstFreeDate, "DD/MM/YYYY");

    const message = `${doctorName} next appointment: ${firstFreeDate}`;
    console.log(message);
    const now = dayjs();
    const next2Weeks = now.add(2, 'week');
    if (currentDate.isBefore(next2Weeks) && currentDate.isAfter(now)) {
      await client.messages.create({
        from: process.env.TTTTPHONE,
        to: process.env.TTTMYPHONE,
        body: `${message}\n${url}`
      });
    }
  }
});
