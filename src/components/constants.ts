import fs from "node:fs";

const fileName = "propertyradardocs-bffa6317385e.json";
const keys = JSON.parse(fs.readFileSync(fileName).toString())

export const constants = {
    client_email: keys.client_email,
    private_key: keys.private_key,
    ownerSheetID: "1kKF2y8WljHea4lXZ-JpPeDdG5cxTOxoDtgMqRk1_pfk",
    bannedkeywordsSheetID: "1-13BTRytudlaIN9FHHvss_mQLug26d5p-9T-S14zHi4"
};
