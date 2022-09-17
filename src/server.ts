import { PrismaClient } from "@prisma/client";
import express from "express";
import { convertMinutesToHoursString } from "./utils/convert-minutes-to-hours-string";
import { convertStringHoursToMinutes } from "./utils/convert-string-hours-to-minutes";

const app = express();
app.use(express.json());

const prisma = new PrismaClient();

app.get("/games", async (request, response) => {
    const games = await prisma.game.findMany({
        include: {
            _count: {
                select: {
                    Ad: true
                }
            }
        }
    });

    return response.status(200).json(games);
})

app.post("/games/:id/ads", async (request, response) => {
    const gameId = request.params.id;
    const body: any = request.body;

    const newAd = await prisma.ad.create({
        data: {
            gameId,
            name: body.name,
            yearsPlaying: body.yearsPlaying,
            discord: body.discord,
            weekDays: body.weekDays.join(','),
            hoursStart: convertStringHoursToMinutes(body.hoursStart),
            hoursEnd: convertStringHoursToMinutes(body.hoursEnd),
            useVoiceChannel: body.useVoiceChannel
        }
    });

    return response.status(201).json(newAd);
});

app.get("/games/:id/ads", async (request, response) => {
    const gameId = request.params.id;

    const ads = await prisma.ad.findMany({
        select: {
            name: true,
            yearsPlaying: true,
            weekDays: true,
            hoursStart: true,
            hoursEnd: true,
            useVoiceChannel: true,
            discord: false,
            createdAt: false
        },
        where: {
            gameId: gameId
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    return response.json(ads.map(ad => {
        return {
            ...ad,
            weekDays: ad.weekDays.split(','),
            hoursStart: convertMinutesToHoursString(ad.hoursStart),
            hoursEnd: convertMinutesToHoursString(ad.hoursEnd),
        }
    }));
});

app.get("/ads/:id/discord", async (request, response) => {
    const adId = request.params.id;

    const discord = await prisma.ad.findFirstOrThrow({
        select: {
            discord: true
        },
        where: {
            id: adId
        }
    });

    return response.status(200).json(discord);
});


app.listen(3333, () => {
    console.log("Server is running on  port 3333.");
});