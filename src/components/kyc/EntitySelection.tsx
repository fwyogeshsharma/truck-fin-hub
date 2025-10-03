import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EntityType } from '@/lib/kyc-types';
import { User, Building2, Users, Briefcase, Scale } from 'lucide-react';

interface EntitySelectionProps {
  onSelect: (type: EntityType) => void;
  currentType?: EntityType;
}

const entities = [
  {
    type: 'individual' as EntityType,
    title: 'Individual',
    description: 'Personal investment account',
    icon: User,
  },
  {
    type: 'company' as EntityType,
    title: 'Private Limited / Public Limited Company',
    description: 'Registered company under Companies Act',
    icon: Building2,
  },
  {
    type: 'partnership' as EntityType,
    title: 'Partnership Firm',
    description: 'Registered partnership business',
    icon: Users,
  },
  {
    type: 'llp' as EntityType,
    title: 'LLP (Limited Liability Partnership)',
    description: 'LLP registered under LLP Act',
    icon: Briefcase,
  },
  {
    type: 'trust' as EntityType,
    title: 'Trust / Society / NGO',
    description: 'Registered trust or charitable organization',
    icon: Scale,
  },
];

const EntitySelection = ({ onSelect, currentType }: EntitySelectionProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Entity Type</CardTitle>
        <CardDescription>
          Choose the type of entity for which you want to complete KYC verification
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {entities.map((entity) => {
            const Icon = entity.icon;
            const isSelected = currentType === entity.type;

            return (
              <button
                key={entity.type}
                onClick={() => onSelect(entity.type)}
                className={`p-6 rounded-lg border-2 transition-all text-left hover:border-primary ${
                  isSelected ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{entity.title}</h3>
                    <p className="text-sm text-muted-foreground">{entity.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default EntitySelection;
