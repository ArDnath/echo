import { Section } from '../lib/section';
import {
  FeatureCard,
  FeatureCardComponent,
  FeatureCardDescription,
  FeatureCardFooter,
  FeatureCardTitle,
} from './feature-card';

import { AnyModel } from './features/any-model';
import { Billing } from './features/billing';

import { cn } from '@/lib/utils';
import { Login } from './features/login';

export const Features = () => {
  return (
    <Section id="features">
      <div className={cn('grid md:grid-cols-3')}>

        <FeatureCard>
          <FeatureCardComponent>
            <Login />
          </FeatureCardComponent>
          <FeatureCardFooter>
            <FeatureCardTitle>Managed Auth</FeatureCardTitle>
            <FeatureCardDescription>
              Drop-in auth components with login, balance and top-ups
            </FeatureCardDescription>
          </FeatureCardFooter>
        </FeatureCard>

        <FeatureCard>
          <FeatureCardComponent>
            <Billing />
          </FeatureCardComponent>
          <FeatureCardFooter>
            <FeatureCardTitle>Zero-cost Infra</FeatureCardTitle>
            <FeatureCardDescription>
              Users pay usage, Echo settles costs and returns your share
            </FeatureCardDescription>
          </FeatureCardFooter>
        </FeatureCard>

        <FeatureCard>
          <FeatureCardComponent>
            <AnyModel />
          </FeatureCardComponent>
          <FeatureCardFooter>
            <FeatureCardTitle>Any Model, Any Scale</FeatureCardTitle>
            <FeatureCardDescription>
              Serve any model with maximum rate limits and minimum latency
            </FeatureCardDescription>
          </FeatureCardFooter>
        </FeatureCard>


        {/* <FeatureCard>
          <FeatureCardComponent>
            <UniversalBalance />
          </FeatureCardComponent>
          <FeatureCardFooter>
            <FeatureCardTitle>Universal Balance</FeatureCardTitle>
            <FeatureCardDescription>
              Echo credits can be used on any app in our network
            </FeatureCardDescription>
          </FeatureCardFooter>
        </FeatureCard> */}


      </div>
    </Section>
  );
};
