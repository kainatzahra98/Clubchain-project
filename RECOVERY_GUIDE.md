# Step-by-Step Environment Recovery

The error `Cannot find module 'object.assign'` happens because your `node_modules` folder is in an "inconsistent state"—some files were installed, but their dependencies (like `object.assign`) were missed or locked during previous attempts.

Follow these steps exactly to perform a **Clean Force Reinstall**:

### 1. Stop Any Running Code
Make sure to stop your server first.
- Go to any terminal window where `npm run dev` or `nodemon` is running.
- Press `Ctrl + C` repeatedly until the process stops and you see the command prompt again.

### 2. Grant Permissions (MacOS Only)
If you haven't done this yet, MacOS might be blocking the "delete" and "install" actions.
- Open **System Settings**.
- Search for **Full Disk Access**.
- Ensure your **Terminal** (or **Cursor**, or **VS Code**) is toggled **ON**.

### 3. The "Deep Clean" Command
Run this command from the main `clubz-UI` folder (the root) to wipe everything corrupted at once. **Copy and paste this exactly:**
```bash
rm -rf node_modules package-lock.json backend/node_modules backend/package-lock.json
```
*(If you get a "Permission denied" error here, try adding `sudo` at the beginning, but usually the step above fixes it.)*

### 4. Reinstall Root Dependencies
Stay in the main folder and run:
```bash
npm install
```
*Wait for this to finish completely.*

### 5. Reinstall Backend Dependencies
Now, go into the backend folder and install its specific packages:
```bash
cd backend
npm install
```
*Wait for this to finish completely.*

### 6. Verify and Start
Now your dependencies are "fresh." You can start the server:
```bash
npm run dev
```

---

### Why is this happening?
When `npm install` is interrupted (by a network spike or a file lock), it sometimes records that a package is "installed" even if its *sub-dependencies* are missing. Deleting the `package-lock.json` and `node_modules` together forces the system to re-verify every single small file.
