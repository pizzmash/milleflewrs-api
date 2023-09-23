const express = require('express');
const router = express.Router();

const ps = require('@prisma/client');
const prisma = new ps.PrismaClient();

async function getMakeableCocktailsId() {
    const idsDictArray = await prisma.$queryRaw`
    SELECT c.id
    FROM Cocktail c
    WHERE NOT EXISTS (
        SElECT 1
        FROM (
            SELECT drinkId
            FROM CocktailDrink 
            WHERE cocktailId = c.id 
        ) cd
        JOIN Drink d ON cd.drinkId = d.id
        WHERE NOT EXISTS (
            SELECT 1
            FROM (
                SELECT id
                FROM Drink d2
                WHERE d2.kindId = d.kindId
            ) d3
            WHERE EXISTS (
                SELECT 1
                FROM Stock s
                WHERE s.drinkId = d3.id
                AND NOT s.deleteFlag
            )
        )
    )`;
    const ids = idsDictArray.map(item => item.id);
    return ids;
}

// 作成可能なカクテル取得
router.get('/makeable', async (req, res, next) => {
    const ids = await getMakeableCocktailsId()
    prisma.cocktail.findMany({
        where: {
            id: {
                in: ids
            }
        },
        include: {
            cocktailDrink: {
                include: {
                    drink: true
                }
            }
        }
    }).then(cocktails => {
        res.json(cocktails);
    });
});

module.exports = router;