import type { World } from '../../schema';
import { doCulture } from './culture';
import { doLinux } from './linux';
import { doNetworking } from './networking';
import { doWorkflows } from './workflows';
import { doCicd } from './cicd';
import { doContainers } from './containers';
import { doK8sBasics } from './k8s-basics';
import { doK8sAdvanced } from './k8s-advanced';
import { doDelivery } from './delivery';
import { doIac } from './iac';
import { doConfigMgmt } from './config-mgmt';
import { doDevsecops } from './devsecops';
import { doPlatform } from './platform';
import { doPipelines } from './pipelines';
import { doEdge } from './edge';
import { doBoss } from './boss';

export const doWorld: World = {
  id: 'devops',
  title: 'DevOps',
  hue: '#5B6CC2',
  tagline: 'Build it, ship it, run it: automation from laptop to production',
  intro: [
    { t: 'text', md: "DevOps is how modern teams get code from a laptop to millions of users safely, many times a day. This world covers the culture and metrics behind it, the Linux and networking every operator needs, Git workflows and CI/CD pipelines, containers and Kubernetes from basics to production, Helm and GitOps, infrastructure as code with Terraform, configuration management, DevSecOps, and platform engineering.\n\nExamples use Bash, YAML, Dockerfiles, Terraform, GitHub Actions, Kubernetes, Helm, Argo CD, and Ansible, and you practise by implementing the logic behind the tools yourself." },
  ],
  chapters: [doCulture, doLinux, doNetworking, doWorkflows, doCicd, doContainers, doK8sBasics, doK8sAdvanced, doDelivery, doIac, doConfigMgmt, doDevsecops, doPlatform, doPipelines, doEdge],
  boss: doBoss,
};
