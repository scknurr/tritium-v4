import React, { useState } from 'react';
import { Card, Button, TextInput, Label, Textarea, Select } from 'flowbite-react';
import { testAuditLogging, testDescriptionChange } from '../lib/testHelpers';
import { startConsoleCapture, shareConsoleLogsWithAI } from '../lib/consoleCapture';
import { supabase } from '../lib/supabase';

export function TestPage() {
  const [entityType, setEntityType] = useState('skills');
  const [entityId, setEntityId] = useState('');
  const [testName, setTestName] = useState('Test Entity');
  const [testDescription, setTestDescription] = useState('This is a test description');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  // Ensure console capture is started
  React.useEffect(() => {
    startConsoleCapture();
  }, []);

  const handleTestAuditLogging = async () => {
    setLoading(true);
    setResult('Running audit logging test...');
    
    try {
      // Create a test entity based on the selected type
      const testData = {
        name: testName,
        description: testDescription
      };
      
      if (entityType === 'skills') {
        // Add skill-specific fields
        Object.assign(testData, {
          category_id: 1 // Default category
        });
      } else if (entityType === 'customers') {
        // Add customer-specific fields
        Object.assign(testData, {
          industry_id: 1 // Default industry
        });
      }
      
      // Run the test
      await testAuditLogging(entityType, testData);
      
      setResult(`Audit logging test completed successfully. Check the console logs for details.`);
    } catch (error) {
      console.error('Test failed:', error);
      setResult(`Test failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTestDescriptionChange = async () => {
    if (!entityId) {
      setResult('Please enter an entity ID');
      return;
    }
    
    setLoading(true);
    setResult('Testing description change...');
    
    try {
      await testDescriptionChange(
        entityType as 'skills' | 'customers',
        parseInt(entityId, 10)
      );
      
      setResult(`Description change test completed successfully. Check the console logs for details.`);
    } catch (error) {
      console.error('Test failed:', error);
      setResult(`Test failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleQueryRawAuditLogs = async () => {
    setLoading(true);
    setResult('Querying raw audit logs...');
    
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('entity_type', entityType)
        .order('event_time', { ascending: false })
        .limit(5);
        
      if (error) throw error;
      
      console.log('Raw audit logs:', data);
      setResult(`Raw audit logs retrieved. Check the console for details.`);
    } catch (error) {
      console.error('Query failed:', error);
      setResult(`Query failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleShareLogs = () => {
    const logs = shareConsoleLogsWithAI();
    setResult('Logs copied to clipboard and opened in new window');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Debugging Test Page</h1>
      <p className="text-gray-600 dark:text-gray-300">
        Use this page to test audit logging and debug issues.
      </p>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-xl font-semibold mb-4">Test Audit Logging</h2>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="entity-type">Entity Type</Label>
              <Select
                id="entity-type"
                value={entityType}
                onChange={(e) => setEntityType(e.target.value)}
              >
                <option value="skills">Skills</option>
                <option value="customers">Customers</option>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="test-name">Test Entity Name</Label>
              <TextInput
                id="test-name"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="test-description">Test Description</Label>
              <Textarea
                id="test-description"
                value={testDescription}
                onChange={(e) => setTestDescription(e.target.value)}
                rows={3}
              />
            </div>
            
            <Button
              color="blue"
              onClick={handleTestAuditLogging}
              disabled={loading}
            >
              {loading ? 'Running Test...' : 'Test Create/Update/Delete'}
            </Button>
          </div>
        </Card>
        
        <Card>
          <h2 className="text-xl font-semibold mb-4">Test Description Change</h2>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="entity-type-desc">Entity Type</Label>
              <Select
                id="entity-type-desc"
                value={entityType}
                onChange={(e) => setEntityType(e.target.value)}
              >
                <option value="skills">Skills</option>
                <option value="customers">Customers</option>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="entity-id">Entity ID</Label>
              <TextInput
                id="entity-id"
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
                placeholder="Enter existing entity ID"
              />
            </div>
            
            <Button
              color="purple"
              onClick={handleTestDescriptionChange}
              disabled={loading || !entityId}
            >
              {loading ? 'Testing...' : 'Test Description Change'}
            </Button>
          </div>
        </Card>
      </div>
      
      <Card>
        <h2 className="text-xl font-semibold mb-4">Database Tools</h2>
        
        <div className="flex flex-wrap gap-4">
          <Button
            color="gray"
            onClick={handleQueryRawAuditLogs}
            disabled={loading}
          >
            Query Raw Audit Logs
          </Button>
          
          <Button
            color="green"
            onClick={handleShareLogs}
          >
            Copy Console Logs for AI
          </Button>
        </div>
      </Card>
      
      {result && (
        <Card>
          <h2 className="text-xl font-semibold mb-2">Result</h2>
          <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-auto max-h-60">
            {result}
          </pre>
        </Card>
      )}
    </div>
  );
} 