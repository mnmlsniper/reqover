import {Router} from 'express';
import ProjectsController from '../controllers/projects.controller';

class ProjectRoute {
    public router = Router();
    public projectsController = new ProjectsController();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get('/projects', this.projectsController.listProjects);
        this.router.post('/projects', this.projectsController.createProject);
    }
}

export default ProjectRoute;
