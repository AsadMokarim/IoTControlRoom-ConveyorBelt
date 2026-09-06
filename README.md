```markdown
# iot-dashboard

Health monitoring system for industrial conveyor belts.

## Download

Clone via HTTPS:

```bash
git clone https://codefloe.com/ma-writes/iot-dashboard.git
```

Or via SSH:

```bash
git clone git@codefloe.com:ma-writes/iot-dashboard.git
```

Or download the archive directly:

```text
https://codefloe.com/ma-writes/iot-dashboard/archive/main.zip
```

## Commands

```bash
# Serve the PHP dashboard
cd iot-dashboard
php -S localhost:8000
```

```bash
# Run the digital twin (separate terminal)
cd digital_twin-main
npm install
npm run dev
```

Then open **http://localhost:8000** in your browser.

> **Note:** `npm run dev` should be running on **http://localhost:5173**.
```

also check out STRUCTURE.md
