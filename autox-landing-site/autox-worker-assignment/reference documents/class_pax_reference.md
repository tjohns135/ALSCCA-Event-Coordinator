# SCCA PAX Classes & App Configuration

## Standard Classes (ALSCCA Groupings)

| Class | Name | PAX Codes |
|:---:|---|---|
| S1 | Street 1 | SS, AS, BS, FS |
| S2 | Street 2 | CS, ES |
| S3 | Street 3 | DS, GS, HS, SSC, HCS |
| ST | Street Touring | SST, AST, BST, CST, DST, EST, GST |
| CAM | Classic American Muscle | CAMS, CAMC, CAMT |
| XS | Xtreme Street | XA, XB |

All PAX codes within a class stay in the same run group.

## Special Classes

| Class | Name | Behavior |
|:---:|---|---|
| X | Pro | Any PAX. Self-designated experienced drivers |
| L | Ladies | Any PAX. Follow mode: grouped with their PAX's parent class. Separate mode: own run group |
| N | Novice | Any PAX. Follow mode: grouped with their PAX's parent class. Separate mode: own run group |
| R | Race Tire | Any PAX. FSAE and catch-all for rare vehicles |

## Unmapped SCCA PAX Codes

Rarely seen at ALSCCA. Entrants with these are manually assigned to a run group.

- **Street Prepared:** SSP, CSP, DSP, ESP, FSP
- **Street Modified:** SSM, SM, SMF
- **Prepared:** XP, CP, DP, EP, FP
- **Modified:** AM, BM, CM, DM, EM, FM

## How Classes Work in the App

- **PAX-to-class mapping** is defined in `js/config.js`. Each standard class lists its PAX codes. When a CSV is loaded, each entrant's PAX determines their class.
- **Reassigning PAX codes per-event:** The PAX-to-Class configuration grid in the UI lets you move any PAX to a different class for the current event (e.g., move CST from ST to S2). This immediately updates class counts and run group balance. Changes reset on page reload.
- **Novice/Ladies modes:** Toggle between "follow" (grouped with their PAX's parent class for run group balancing) and "separate" (treated as their own class). This affects run group splitting only.
- **Novices excluded from specialized positions:** The worker assignment algorithm only assigns novices to corner worker roles, not experienced positions like Starter or Spotter.
