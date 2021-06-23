import {NextFunction, Request, Response} from 'express';

const projects = [
    {
        id: 1,
        name: 'Demo',
    },
];

class ProjectsController {
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
