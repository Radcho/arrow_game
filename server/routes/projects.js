const path = require('path');
const fs = require('fs').promises;
const router = require('express').Router();
const projects = path.resolve(__dirname, '../projects');

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

router.delete('/:name', async (req, res) => {
    try {
        const realName = await getRealProjectName(req.params.name);
        if (realName) {
            await fs.unlink(path.join(projects, realName));
        }

        res.sendStatus(200);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

async function getRealProjectName(name) {
    const file = (await fs.readdir(projects, { withFileTypes: true }))
        .find((entry) => entry.isFile() && path.parse(entry.name).name === name);

    if (file) {
        return file.name;
    }
}

module.exports = router;
