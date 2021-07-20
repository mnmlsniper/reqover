import {NextFunction, Request, Response} from 'express';
import {API_SERVICE_URL, SWAGGER_SPEC_URL} from '../config/constants';

const projects = [
    {
        id: 1,
        name: 'Demo project',
    },
];

class ProjectsController {
    public get_project_by_id = async (req: Request, res: Response, next: NextFunction) => {
        const id = req.params.id;
        const project = projects.filter((p) => p.id === +id)[0];
        if (project != null) {
            res.render('main', {apiUrl: API_SERVICE_URL, specUrl: SWAGGER_SPEC_URL, graphqlUrl: ''});
        }

        res.send('Error');
    };

    public createProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const project = projects.slice(-1)[0] as any;
        const body = await req.body;
        const newProject = {
            id: project.id + 1,
            name: body.name,
        };

        projects.push(newProject);
        res.send(newProject);
    };

    public listProjects = async (req: Request, res: Response, next: NextFunction) => {
        res.send(projects);
    };

    public index = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        res.render('projects');
    };
}

export default ProjectsController;
