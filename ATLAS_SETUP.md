# GigShield Atlas Setup

## Recommended databases

- `gigshield_dev`
- `gigshield_staging`
- `gigshield_prod`

## Connection string format

```text
mongodb+srv://gigshield_app:<URL_ENCODED_PASSWORD>@cluster0.1thy2sd.mongodb.net/gigshield_dev?retryWrites=true&w=majority&appName=Cluster0
```

## Safety notes

- Rotate any password that was shown in screenshots before using Atlas.
- URL-encode the password before inserting it into the URI.
- Keep `ENABLE_SEED=false` for Atlas environments unless you intentionally want test data.
- Keep `ALLOW_PRODUCTION_SEED=false` in production.

## Environment templates

- Dev Atlas template: [gigshield/.env.atlas.example](/C:/Guidewire_Hackathon/gigshield/.env.atlas.example)
- Production template: [backend/.env.production.example](/C:/Guidewire_Hackathon/gigshield/backend/.env.production.example)

## Still needed from the user

- Final Atlas password or completed URI
- Preferred app user name
- Which database to wire first: `gigshield_dev`, `gigshield_staging`, or `gigshield_prod`
