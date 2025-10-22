/**
 * Integration test for send email functionality
 *
 * This test verifies the email sending functionality by making actual API calls
 * to the Dynatrace environment. These tests require valid authentication credentials
 * and the email:emails:send scope.
 * 
 * IMPORTANT: Update the TEST_EMAIL_* variables below with your own email addresses
 * be        subject: '[Integration Test] Invalid Email Test',
        body: {
          body: 'Testing invalid email address handling.',
        },
      };unning these tests to avoid sending emails to unintended recipients.
 */

import { config } from 'dotenv';
import { createDtHttpClient } from '../src/authentication/dynatrace-clients';
import { listProblems } from '../src/capabilities/list-problems-via-api';
import { getDynatraceEnv, DynatraceEnv } from '../src/getDynatraceEnv';

// Load environment variables
config();

const API_RATE_LIMIT_DELAY = 100; // Delay in milliseconds to avoid hitting API rate limits

const scopesBase = [
  'app-engine:apps:run', // needed for environmentInformationClient
  'app-engine:functions:run', // needed for environmentInformationClient
];

const scopesListProblems = [
  'environment-api:problems:read', // Read problems
  'storage:events:read',
  'storage:buckets:read',
];

describe('List Problems Integration Tests', () => {
  let dynatraceEnv: DynatraceEnv;

  // Setup that runs once before all tests
  beforeAll(async () => {
    try {
      dynatraceEnv = getDynatraceEnv();
      console.log(`Testing against environment: ${dynatraceEnv.dtEnvironment}`);
    } catch (err) {
      throw new Error(`Environment configuration error: ${(err as Error).message}`);
    }
  });

  afterEach(async () => {
    // Add delay to avoid hitting API rate limits
    await new Promise((resolve) => setTimeout(resolve, API_RATE_LIMIT_DELAY));
  });

  describe('Basic List Problems', () => {
    it('should list problems, no filters', async () => {
      const dtClient = await createDtHttpClient(
        dynatraceEnv.dtEnvironment,
        //dynatraceEnv.dtLiveEnvironment,
        scopesBase.concat(scopesListProblems),
        dynatraceEnv.oauthClientId,
        dynatraceEnv.oauthClientSecret,
        dynatraceEnv.dtPlatformToken,
      );

      const response = await listProblems(dtClient);
      console.log(response);

      expect(response).toBeDefined();
      expect(response?.totalCount).toBeDefined();
      expect(response?.problems).toBeDefined();
      response.problems.forEach((problem: any) => {
        expect(problem).toBeDefined();
        expect(problem?.displayId).toBeDefined();
        expect(problem?.problemId).toBeDefined();
        expect(problem?.status).toBeDefined();
        expect(problem?.title).toBeDefined();
        expect(problem?.severityLevel).toBeDefined();
        expect(problem?.startTime).toBeDefined();
        expect(problem?.endTime).toBeDefined();

        // Not defined:
        // expect(problem?.category).toBeDefined();
      });
    }, 30000); // 30 second timeout
  });
});
