const path = require('path');
const fs = require('fs').promises;
const router = require('express').Router();
const projects = path.resolve(__dirname, '../projects');

/**
 * Get a list of saved projects
 */
router.get('/', async (req, res) => {
    try {
        const projectFiles = (await fs.readdir(projects, { withFileTypes: true }))
            .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
            .map((entry) => entry.name.replace(/\.json$/, ''));
        res.json(projectFiles);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

/**
 * Get the specific file from the file system.
 */
router.get('/:name', async (req, res) => {
    let projectName;
    try {
        projectName = await getRealProjectName(req.params.name);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
    if (projectName) {
        const project = await fs.readFile(path.join(projects, projectName));
        try {
            res.json(JSON.parse(project));
        } catch (err) {
            res.status(500).send(`Project with the name ${req.params.name} could not be loaded. Error: ${err.message}`)
        }
    } else {
        res.sendStatus(404);
    }
});

/**
 * Save the project to a new file on the system. If a file with the same name already exists, replace it.
 */
router.post('/save', async (req, res) => {
    try {
        const name = req.body.name;
        const project = req.body.project;
        if (!name || !project) {
            res.status(400).send(`Invalid request sent.`);
        } else {
            const existingProject = await getRealProjectName(name);
            if (existingProject) {
                await fs.unlink(path.join(projects, existingProject));
            }

            const newName = `${name}.json`;
            const projectContent = JSON.stringify(project, null, 4);
            await fs.writeFile(path.join(projects, newName), projectContent);
            res.sendStatus(200);
        }
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

/**
 * Get the real filename on the file system
 * @param {string} name User-friendly name of the file
 */
async function getRealProjectName(name) {
    const file = (await fs.readdir(projects, { withFileTypes: true }))
        .find((entry) => entry.isFile() && path.parse(entry.name).name === encodeURIComponent(name));

    if (file) {
        return file.name;
    }
}

module.exports = router;
