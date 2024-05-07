const puppeteer = require('puppeteer');
const fs = require('fs');

import { searchMeal, favoriteMeals, baseUrls } from './data.js';

// ***This function does NOT automatically update the allMeals variable***
export async function scrapeAllMeals() {
    const browser = await puppeteer.launch();
    
    // Get today's date
    let today = new Date();

    // Create a Set to store all unique meals
    let allMeals = new Set();

    for (let i = 0; i < 7; i++) {
        // Format the date as 'yyyy-mm-dd'
        let date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        for (let baseUrl of baseUrls) {
            const page = await browser.newPage();
            await page.goto(`${baseUrl}${date}`);

            // Now you can scrape the updated content
            let menuItems = await page.$$eval('.menu-item', items => items.map(item => item.innerText.replace(/\n/g, '').split('Contains:')[0].trim()));

            // Add all meals to the Set
            for (let item of menuItems) {
                allMeals.add(item);
            }

            await page.close();
        }

        // Increment the date by one day
        today.setDate(today.getDate() + 1);
    }

    console.log('Writing meals to file...');
    fs.writeFileSync('all-meals.txt', Array.from(allMeals).join(', '));
    console.log('Done!');

    await browser.close();
}

export async function scrapeWebsiteForMealSchedule(meals = []) {
    if (meals.length === 0) return;

    const browser = await puppeteer.launch();

    let today = new Date();
    let found = false;

    for (let day = 0; day < 7; day++) {
        let date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        for (let baseUrl of baseUrls) {
            const page = await browser.newPage();
            await page.goto(`${baseUrl}${date}`);

            const diningHall = await page.$eval('.rhs-block-content h1', h1 => h1.innerText);

            let breakfastItems = await page.$$eval('.meal-title.breakfast', items => items.map(item => item.innerText.replace(/\n/g, '').split('Contains:')[0].trim()));
            let lunchItems = await page.$$eval('.meal-title.lunch', items => items.map(item => item.innerText.replace(/\n/g, '').split('Contains:')[0].trim()));
            let dinnerItems = await page.$$eval('.meal-title.dinner', items => items.map(item => item.innerText.replace(/\n/g, '').split('Contains:')[0].trim()));

            for (let meal of meals) {
                if (breakfastItems.some(item => item.includes(meal))) {
                    console.log(`${meal} is available for breakfast at ${diningHall} on ${date}.`);
                    found = true;
                }
                if (lunchItems.some(item => item.includes(meal))) {
                    console.log(`${meal} is available for lunch at ${diningHall} on ${date}.`);
                    found = true;
                }
                if (dinnerItems.some(item => item.includes(meal))) {
                    console.log(`${meal} is available for dinner at ${diningHall} on ${date}.`);
                    found = true;
                }
            }

            await page.close();
        }

        today.setDate(today.getDate() + 1);
    }

    if (!found) console.log(`None of the meals are available at any dining hall within the next 7 days.`);

    await browser.close();
}

export async function scrapeWebsiteForSingleDay(meals = []) {
    if (meals.length === 0) return;
    const browser = await puppeteer.launch();
    
    // Get today's date in the format 'yyyy-mm-dd'
    const today = new Date();
    const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    for (let baseUrl of baseUrls) {
        const page = await browser.newPage();
        await page.goto(`${baseUrl}${date}`);

        // Get all elements with the class 'meal-title breakfast'
        let breakfastItems = await page.$$eval('.meal-title.breakfast', items => items.map(item => item.innerText.replace(/\n/g, '').split('Contains:')[0].trim()));

        // Get all elements with the class 'meal-title lunch'
        let lunchItems = await page.$$eval('.meal-title.lunch', items => items.map(item => item.innerText.replace(/\n/g, '').split('Contains:')[0].trim()));

        // Get all elements with the class 'meal-title dinner'
        let dinnerItems = await page.$$eval('.meal-title.dinner', items => items.map(item => item.innerText.replace(/\n/g, '').split('Contains:')[0].trim()));

        // Check if any of the meals exists in the breakfast, lunch, or dinner items
        for (let meal of meals) {
            if (breakfastItems.some(item => item.includes(meal))) {
                const diningHall = await page.$eval('.rhs-block-content h1', h1 => h1.innerText);
                console.log(`${meal} is available for breakfast at ${diningHall} today.`);
            }
            if (lunchItems.some(item => item.includes(meal))) {
                const diningHall = await page.$eval('.rhs-block-content h1', h1 => h1.innerText);
                console.log(`${meal} is available for lunch at ${diningHall} today.`);
            }
            if (dinnerItems.some(item => item.includes(meal))) {
                const diningHall = await page.$eval('.rhs-block-content h1', h1 => h1.innerText);
                console.log(`${meal} is available for dinner at ${diningHall} today.`);
            }
        }

        await page.close();
    }

    await browser.close();
}
