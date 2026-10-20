import type { World } from '../../schema';
import { clFoundations } from './foundations';
import { clIdentity } from './identity';
import { clNetworking } from './networking';
import { clCompute } from './compute';
import { clContainers } from './containers';
import { clServerless } from './serverless';
import { clStorage } from './storage';
import { clDatabases } from './databases';
import { clMessaging } from './messaging';
import { clObservability } from './observability';
import { clSecurity } from './security';
import { clIac } from './iac';
import { clCost } from './cost';
import { clReliability } from './reliability';
import { clAws } from './aws';
import { clAzure } from './azure';
import { clGcp } from './gcp';
import { clDataAi } from './data-ai';
import { clBoss } from './boss';

export const clWorld: World = {
  id: 'cloud',
  title: 'Cloud',
  hue: '#E07A2E',
  tagline: 'AWS, Azure, and Google Cloud from first principles to production',
  intro: [
    { t: 'text', md: "The cloud is where most software now runs. This world teaches the ideas that carry across providers and shows each one in AWS, Azure, and Google Cloud side by side: service models and regions, identity and access, networking, compute, containers, serverless, storage, managed databases, messaging, observability, security, infrastructure as code, cost management, and disaster recovery, followed by a closer look at each provider and at data and AI services.\n\nExamples use the AWS CLI, the Azure CLI, gcloud, JSON policies, and Terraform. The exercises have you implement the logic behind the services yourself, such as policy evaluation, subnet maths, autoscaling decisions, and cost estimates." },
  ],
  chapters: [clFoundations, clIdentity, clNetworking, clCompute, clContainers, clServerless, clStorage, clDatabases, clMessaging, clObservability, clSecurity, clIac, clCost, clReliability, clAws, clAzure, clGcp, clDataAi],
  boss: clBoss,
};
