import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Truck, Plus, X, MapPin, 
  Container, Snowflake, Fuel, Package, 
  Zap, Car, MoreHorizontal
} from 'lucide-react';

const equipmentTypes = [
  { id: 'dry_van', name: 'Dry Van', icon: Container },
  { id: 'flatbed', name: 'Flatbed', icon: Package },
  { id: 'reefer', name: 'Reefer', icon: Snowflake },
  { id: 'tanker', name: 'Tanker', icon: Fuel },
  { id: 'step_deck', name: 'Step Deck', icon: Truck },
  { id: 'hotshot', name: 'Hotshot', icon: Zap },
  { id: 'sprinter', name: 'Sprinter', icon: Car },
  { id: 'other', name: 'Other', icon: MoreHorizontal },
];

const eldProviders = [
  'Samsara',
  'Motive (KeepTruckin)',
  'Omnitracs',
  'PeopleNet',
  'Geotab',
  'BigRoad',
  'Other',
  'None',
];

const FleetLanesStep = ({ data, onChange }) => {
  const [newLane, setNewLane] = useState({ origin: '', destination: '', serviceType: 'ftl' });

  const handleInputChange = (field, value) => {
    onChange({ [field]: value });
  };

  const handleEquipmentToggle = (equipmentId) => {
    const current = data.equipmentTypes || [];
    const updated = current.includes(equipmentId)
      ? current.filter(id => id !== equipmentId)
      : [...current, equipmentId];
    onChange({ equipmentTypes: updated });
  };

  const handleAddLane = () => {
    if (!newLane.origin || !newLane.destination) return;
    if ((data.preferredLanes || []).length >= 5) {
      alert('Maximum 5 lanes allowed');
      return;
    }
    
    const lanes = [...(data.preferredLanes || []), { ...newLane, id: Date.now() }];
    onChange({ preferredLanes: lanes });
    setNewLane({ origin: '', destination: '', serviceType: 'ftl' });
  };

  const handleRemoveLane = (laneId) => {
    const lanes = (data.preferredLanes || []).filter(lane => lane.id !== laneId);
    onChange({ preferredLanes: lanes });
  };

  return (
    <div className="space-y-8" data-testid="fleet-lanes-step">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <Truck className="w-7 h-7 text-[#00D4FF]" />
          Fleet & Lanes
        </h2>
        <p className="text-[#8B9DB5] mt-2">
          Tell us about your fleet and preferred operating lanes
        </p>
      </div>

      {/* Fleet Size */}
      <div className="bg-[#0D1B2A] rounded-xl p-6 border border-[#1B3A5A]">
        <h3 className="text-lg font-semibold text-white mb-6">Fleet Size</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="numberOfTrucks" className="text-white font-medium">
              Number of Trucks
            </Label>
            <Input
              id="numberOfTrucks"
              type="number"
              min="1"
              value={data.numberOfTrucks}
              onChange={(e) => handleInputChange('numberOfTrucks', e.target.value)}
              placeholder="e.g., 10"
              className="mt-2 bg-[#0A1628] border-[#1B3A5A] text-white placeholder:text-[#5A6B7D] focus:border-[#00D4FF]"
              data-testid="trucks-count-input"
            />
          </div>

          <div>
            <Label htmlFor="numberOfTrailers" className="text-white font-medium">
              Number of Trailers
            </Label>
            <Input
              id="numberOfTrailers"
              type="number"
              min="0"
              value={data.numberOfTrailers}
              onChange={(e) => handleInputChange('numberOfTrailers', e.target.value)}
              placeholder="e.g., 15"
              className="mt-2 bg-[#0A1628] border-[#1B3A5A] text-white placeholder:text-[#5A6B7D] focus:border-[#00D4FF]"
              data-testid="trailers-count-input"
            />
          </div>
        </div>
      </div>

      {/* Equipment Types */}
      <div className="bg-[#0D1B2A] rounded-xl p-6 border border-[#1B3A5A]">
        <h3 className="text-lg font-semibold text-white mb-6">Equipment Types</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {equipmentTypes.map((equipment) => {
            const Icon = equipment.icon;
            const isSelected = (data.equipmentTypes || []).includes(equipment.id);
            
            return (
              <button
                key={equipment.id}
                type="button"
                onClick={() => handleEquipmentToggle(equipment.id)}
                className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                  isSelected
                    ? 'border-[#00D4FF] bg-[#00D4FF]/10 text-[#00D4FF]'
                    : 'border-[#1B3A5A] bg-[#0A1628] text-[#8B9DB5] hover:border-[#2A4A6A]'
                }`}
                data-testid={`equipment-${equipment.id}`}
              >
                <Icon className="w-8 h-8" />
                <span className="text-sm font-medium">{equipment.name}</span>
                {isSelected && (
                  <div className="w-4 h-4 rounded-full bg-[#00D4FF] flex items-center justify-center">
                    <svg className="w-3 h-3 text-[#0A1628]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Capabilities */}
      <div className="bg-[#0D1B2A] rounded-xl p-6 border border-[#1B3A5A]">
        <h3 className="text-lg font-semibold text-white mb-6">Capabilities</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-[#0A1628] rounded-lg border border-[#1B3A5A]">
            <div>
              <Label className="text-white font-medium">Hazmat Capable?</Label>
              <p className="text-[#8B9DB5] text-sm mt-1">
                Can your fleet transport hazardous materials?
              </p>
            </div>
            <Switch
              checked={data.hazmatCapable}
              onCheckedChange={(checked) => handleInputChange('hazmatCapable', checked)}
              className="data-[state=checked]:bg-[#00D4FF]"
              data-testid="hazmat-switch"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-[#0A1628] rounded-lg border border-[#1B3A5A]">
            <div>
              <Label className="text-white font-medium">Cross-border Capable?</Label>
              <p className="text-[#8B9DB5] text-sm mt-1">
                Can your fleet operate across US-Canada border?
              </p>
            </div>
            <Switch
              checked={data.crossBorderCapable}
              onCheckedChange={(checked) => handleInputChange('crossBorderCapable', checked)}
              className="data-[state=checked]:bg-[#00D4FF]"
              data-testid="crossborder-switch"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-[#0A1628] rounded-lg border border-[#1B3A5A]">
            <div>
              <Label className="text-white font-medium">24/7 Dispatch?</Label>
              <p className="text-[#8B9DB5] text-sm mt-1">
                Do you have round-the-clock dispatch available?
              </p>
            </div>
            <Switch
              checked={data.is24x7Dispatch}
              onCheckedChange={(checked) => handleInputChange('is24x7Dispatch', checked)}
              className="data-[state=checked]:bg-[#00D4FF]"
              data-testid="dispatch-247-switch"
            />
          </div>
        </div>
      </div>

      {/* ELD Provider */}
      <div className="bg-[#0D1B2A] rounded-xl p-6 border border-[#1B3A5A]">
        <h3 className="text-lg font-semibold text-white mb-6">ELD Provider</h3>
        
        <div>
          <Label className="text-white font-medium">Select your ELD provider</Label>
          <Select 
            value={data.eldProvider} 
            onValueChange={(value) => handleInputChange('eldProvider', value)}
          >
            <SelectTrigger 
              className="mt-2 bg-[#0A1628] border-[#1B3A5A] text-white focus:border-[#00D4FF]"
              data-testid="eld-provider-select"
            >
              <SelectValue placeholder="Select ELD provider" />
            </SelectTrigger>
            <SelectContent className="bg-[#0D1B2A] border-[#1B3A5A]">
              {eldProviders.map((provider) => (
                <SelectItem key={provider} value={provider} className="text-white hover:bg-[#1B3A5A]">
                  {provider}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Preferred Lanes */}
      <div className="bg-[#0D1B2A] rounded-xl p-6 border border-[#1B3A5A]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white">Preferred Lanes</h3>
            <p className="text-[#8B9DB5] text-sm mt-1">Add up to 5 preferred operating lanes</p>
          </div>
          <span className="text-[#8B9DB5] text-sm">
            {(data.preferredLanes || []).length}/5 lanes
          </span>
        </div>

        {/* Existing Lanes */}
        {(data.preferredLanes || []).length > 0 && (
          <div className="space-y-3 mb-6">
            {data.preferredLanes.map((lane) => (
              <div
                key={lane.id}
                className="flex items-center gap-3 p-3 bg-[#0A1628] rounded-lg border border-[#1B3A5A]"
              >
                <MapPin className="w-5 h-5 text-[#00D4FF]" />
                <div className="flex-1">
                  <span className="text-white">{lane.origin}</span>
                  <span className="text-[#5A6B7D] mx-2">→</span>
                  <span className="text-white">{lane.destination}</span>
                </div>
                <span className="text-[#8B9DB5] text-sm uppercase">{lane.serviceType}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveLane(lane.id)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                  data-testid={`remove-lane-${lane.id}`}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Add New Lane */}
        {(data.preferredLanes || []).length < 5 && (
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <Input
                value={newLane.origin}
                onChange={(e) => setNewLane({ ...newLane, origin: e.target.value })}
                placeholder="Origin city"
                className="bg-[#0A1628] border-[#1B3A5A] text-white placeholder:text-[#5A6B7D] focus:border-[#00D4FF]"
                data-testid="lane-origin-input"
              />
            </div>
            <div className="flex-1">
              <Input
                value={newLane.destination}
                onChange={(e) => setNewLane({ ...newLane, destination: e.target.value })}
                placeholder="Destination city"
                className="bg-[#0A1628] border-[#1B3A5A] text-white placeholder:text-[#5A6B7D] focus:border-[#00D4FF]"
                data-testid="lane-destination-input"
              />
            </div>
            <Select 
              value={newLane.serviceType} 
              onValueChange={(value) => setNewLane({ ...newLane, serviceType: value })}
            >
              <SelectTrigger className="w-32 bg-[#0A1628] border-[#1B3A5A] text-white focus:border-[#00D4FF]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0D1B2A] border-[#1B3A5A]">
                <SelectItem value="ftl" className="text-white hover:bg-[#1B3A5A]">FTL</SelectItem>
                <SelectItem value="ltl" className="text-white hover:bg-[#1B3A5A]">LTL</SelectItem>
                <SelectItem value="both" className="text-white hover:bg-[#1B3A5A]">Both</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleAddLane}
              disabled={!newLane.origin || !newLane.destination}
              className="bg-[#00D4FF] text-[#0A1628] hover:bg-[#00B8E0] disabled:opacity-50"
              data-testid="add-lane-button"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Lane
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FleetLanesStep;
