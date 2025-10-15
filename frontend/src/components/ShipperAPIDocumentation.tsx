import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code, Key, Lock, FileCode, CheckCircle, XCircle } from 'lucide-react';

const ShipperAPIDocumentation = () => {
  const apiUrl = 'http://localhost:3001/api/public/shippers/trips';
  const basicAuthUsername = 'shipper_api';
  const basicAuthPassword = 'shipper_api_password_2024';
  const demoToken = 'shipper_demo_token';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
          <FileCode className="h-5 w-5" />
            Shipper API Documentation
          </CardTitle>
          <CardDescription>
            Use our API to programmatically create trips in the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="authentication">Authentication</TabsTrigger>
              <TabsTrigger value="endpoint">Endpoint</TabsTrigger>
              <TabsTrigger value="examples">Examples</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950/20 dark:border-blue-800">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <FileCode className="h-4 w-4" />
                  What is the Shipper API?
                </h3>
                <p className="text-sm text-muted-foreground">
                  The Shipper API allows you to create trips programmatically from your own systems.
                  Perfect for integrating with your ERP, TMS, or custom applications.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Base URL</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <code className="bg-muted px-2 py-1 rounded text-sm break-all">
                      {apiUrl}
                    </code>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Method</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge className="bg-green-600">POST</Badge>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Create single or multiple trips in one request
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Secure authentication with Basic Auth + API Token
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Automatic validation of trip data
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Detailed error messages for failed trips
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Authentication Tab */}
            <TabsContent value="authentication" className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg dark:bg-yellow-950/20 dark:border-yellow-800">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Two-Layer Security
                </h3>
                <p className="text-sm text-muted-foreground">
                  Our API uses both Basic Authentication and API Token for enhanced security.
                  You must provide both to access the endpoint.
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    1. Basic Authentication
                  </CardTitle>
                  <CardDescription>HTTP Basic Auth credentials</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-1">Username:</p>
                    <code className="bg-muted px-3 py-2 rounded text-sm block">
                      {basicAuthUsername}
                    </code>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Password:</p>
                    <code className="bg-muted px-3 py-2 rounded text-sm block">
                      {basicAuthPassword}
                    </code>
                  </div>
                  <div className="text-xs text-muted-foreground pt-2">
                    <strong>Note:</strong> In production, credentials will be unique per shipper.
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    2. API Token
                  </CardTitle>
                  <CardDescription>Pass in X-API-Token header</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-1">Header Name:</p>
                    <code className="bg-muted px-3 py-2 rounded text-sm block">
                      X-API-Token
                    </code>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Demo Token (for testing):</p>
                    <code className="bg-muted px-3 py-2 rounded text-sm block break-all">
                      {demoToken}
                    </code>
                  </div>
                  <div className="text-xs text-muted-foreground pt-2">
                    <strong>Note:</strong> Contact admin to get your production API token.
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Endpoint Tab */}
            <TabsContent value="endpoint" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Request Format</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Single Trip:</p>
                    <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`{
  "load_owner_id": "rr",
  "load_owner_name": "RollingRadius",
  "load_owner_logo": "/rr_full_transp_old.png",
  "load_owner_rating": 4.5,
  "client_company": "Berger Paints",
  "client_logo": "/clients/berger.png",
  "origin": "Mumbai, Maharashtra",
  "destination": "Delhi, NCR",
  "distance": 1400,
  "load_type": "Electronics",
  "weight": 15000,
  "amount": 50000,
  "interest_rate": 12,
  "maturity_days": 30,
  "risk_level": "low",
  "insurance_status": true
}`}
                    </pre>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Multiple Trips (Array):</p>
                    <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`[
  {
    "load_owner_id": "rr",
    "load_owner_name": "RollingRadius",
    "origin": "Mumbai, Maharashtra",
    "destination": "Delhi, NCR",
    "distance": 1400,
    "load_type": "Electronics",
    "weight": 15000,
    "amount": 50000
  },
  {
    "load_owner_id": "rr",
    "load_owner_name": "RollingRadius",
    "origin": "Bangalore, Karnataka",
    "destination": "Chennai, Tamil Nadu",
    "distance": 350,
    "load_type": "FMCG",
    "weight": 12000,
    "amount": 35000
  }
]`}
                    </pre>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Validation Rules</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <Badge variant="outline" className="mt-0.5">amount</Badge>
                      <span>Must be between ₹20,000 and ₹80,000</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Badge variant="outline" className="mt-0.5">interest_rate</Badge>
                      <span>Must be between 8% and 18% (optional, default: 12%)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Badge variant="outline" className="mt-0.5">maturity_days</Badge>
                      <span>Number of days (optional, default: 30)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Badge variant="outline" className="mt-0.5">risk_level</Badge>
                      <span>One of: low, medium, high (optional, default: low)</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Response Format</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`{
  "success": true,
  "message": "2 trip(s) created successfully",
  "created_count": 2,
  "failed_count": 0,
  "trip_ids": ["trip-uuid-1", "trip-uuid-2"],
  "shipper": "Demo Shipper",
  "company": "Demo Company"
}`}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Examples Tab */}
            <TabsContent value="examples" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    cURL Example
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Token: ${demoToken}" \\
  -u "${basicAuthUsername}:${basicAuthPassword}" \\
  -d '{
    "load_owner_id": "rr",
    "load_owner_name": "RollingRadius",
    "client_company": "Berger Paints",
    "origin": "Mumbai, Maharashtra",
    "destination": "Delhi, NCR",
    "distance": 1400,
    "load_type": "Electronics",
    "weight": 15000,
    "amount": 50000
  }'`}
                  </pre>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    Python Example
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`import requests
from requests.auth import HTTPBasicAuth

url = "${apiUrl}"
headers = {
    "Content-Type": "application/json",
    "X-API-Token": "${demoToken}"
}
auth = HTTPBasicAuth("${basicAuthUsername}", "${basicAuthPassword}")

trip_data = {
    "load_owner_id": "rr",
    "load_owner_name": "RollingRadius",
    "client_company": "Berger Paints",
    "origin": "Mumbai, Maharashtra",
    "destination": "Delhi, NCR",
    "distance": 1400,
    "load_type": "Electronics",
    "weight": 15000,
    "amount": 50000
}

response = requests.post(url, json=trip_data, headers=headers, auth=auth)
print(response.json())`}
                  </pre>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    JavaScript/Node.js Example
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`const axios = require('axios');

const url = '${apiUrl}';
const username = '${basicAuthUsername}';
const password = '${basicAuthPassword}';
const token = '${demoToken}';

const tripData = {
  load_owner_id: 'rr',
  load_owner_name: 'RollingRadius',
  client_company: 'Berger Paints',
  origin: 'Mumbai, Maharashtra',
  destination: 'Delhi, NCR',
  distance: 1400,
  load_type: 'Electronics',
  weight: 15000,
  amount: 50000
};

axios.post(url, tripData, {
  headers: {
    'Content-Type': 'application/json',
    'X-API-Token': token
  },
  auth: {
    username: username,
    password: password
  }
})
.then(response => console.log(response.data))
.catch(error => console.error(error));`}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Error Codes */}
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-semibold text-sm mb-3">Error Codes</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <Badge variant="destructive">400</Badge>
                <span>Bad Request - Invalid trip data or validation failed</span>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="destructive">401</Badge>
                <span>Unauthorized - Invalid credentials or API token</span>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="destructive">500</Badge>
                <span>Internal Server Error - Server-side error occurred</span>
              </div>
            </div>
          </div>

          {/* Swagger Link */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950/20 dark:border-blue-800">
            <h4 className="font-semibold text-sm mb-2">Try it out with Swagger</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Test the API directly in your browser using our interactive Swagger documentation.
            </p>
            <a
              href="http://localhost:3001/api/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <FileCode className="h-4 w-4" />
              Open Swagger Documentation →
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShipperAPIDocumentation;
