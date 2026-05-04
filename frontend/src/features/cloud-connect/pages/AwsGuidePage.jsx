import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './AwsGuide.module.css'

const steps = [
  {
    id: 1,
    title: 'Sign in to AWS Console',
    icon: '🔐',
    tag: 'Step 1',
    content: (
      <>
        <p>Go to <a href="https://console.aws.amazon.com/iam" target="_blank" rel="noreferrer">console.aws.amazon.com/iam</a> and sign in with your root or admin account.</p>
        <div className="tip">
          <span>💡 Tip</span> Use an account that already has Administrator access. Do <strong>not</strong> use your root account's own access keys.
        </div>
      </>
    ),
  },
  {
    id: 2,
    title: 'Create a new IAM User',
    icon: '👤',
    tag: 'Step 2',
    content: (
      <>
        <p>In the IAM dashboard, navigate to <strong>Users → Create user</strong>.</p>
        <ol>
          <li>Enter a username, e.g. <code>cloudburn-readonly</code></li>
          <li>Select <strong>"Provide user access to the AWS Management Console"</strong> — <em>uncheck this</em> (we only need programmatic access)</li>
          <li>Click <strong>Next</strong></li>
        </ol>
        <div className="tip">
          <span>💡 Tip</span> Keep the username simple and descriptive so you can identify it later.
        </div>
      </>
    ),
  },
  {
    id: 3,
    title: 'Attach the Required Permissions',
    icon: '🛡️',
    tag: 'Step 3',
    content: (
      <>
        <p>On the <strong>Set permissions</strong> page, choose <strong>"Attach policies directly"</strong> and search for and attach the following AWS-managed policies:</p>
        <div className="policyTable">
          <div className="policyHeader">
            <span>Policy Name</span>
            <span>Why Cloudburn Needs It</span>
          </div>
          {[
            { policy: 'AmazonDynamoDBReadOnlyAccess',           reason: 'Read DynamoDB table metrics & usage for cost analysis' },
            { policy: 'AmazonEC2FullAccess',                    reason: 'Full EC2 visibility — required for zombie/idle instance detection' },
            { policy: 'AmazonEC2ReadOnlyAccess',                reason: 'Fallback read-only EC2 access (can use instead of Full)' },
            { policy: 'AmazonRDSReadOnlyAccess',                reason: 'Detect idle RDS instances and read DB cost data' },
            { policy: 'AmazonS3ReadOnlyAccess',                 reason: 'Read S3 bucket usage and storage costs' },
            { policy: 'AWSBillingConductorFullAccess',          reason: 'Full billing conductor access for accurate cost allocation' },
            { policy: 'AWSBillingConductorReadOnlyAccess',      reason: 'Read billing conductor groups and pricing plans' },
            { policy: 'AWSBillingReadOnlyAccess',               reason: 'Read billing & invoice data, payment methods' },
            { policy: 'AWSCostAndUsageReportAutomationPolicy',  reason: 'Access Cost & Usage Reports (CUR) for detailed spend data' },
            { policy: 'Billing',                                reason: 'Core billing job function — required for full billing dashboard access' },
          ].map(({ policy, reason }) => (
            <div className="policyRow" key={policy}>
              <code>{policy}</code>
              <span>{reason}</span>
            </div>
          ))}
        </div>
        <div className="warning">
          <span>⚠️ Important</span> Cloudburn only reads data — it never writes to, modifies, or deletes any AWS resource. All policies above are strictly <strong>read-only</strong>.
        </div>
      </>
    ),
  },
  {
    id: 4,
    title: 'Enable Cost Explorer Access',
    icon: '📊',
    tag: 'Step 4',
    content: (
      <>
        <p>AWS Cost Explorer must be enabled on your account before IAM users can access it.</p>
        <ol>
          <li>Go to <strong>Billing & Cost Management</strong> from the top-right account menu</li>
          <li>Click <strong>Cost Explorer</strong> in the left sidebar</li>
          <li>Click <strong>"Enable Cost Explorer"</strong> if not already active</li>
          <li>Wait 24 hours for historical data to become available (first time only)</li>
        </ol>
        <div className="tip">
          <span>💡 Note</span> If Cost Explorer is already active, you can skip this step.
        </div>
      </>
    ),
  },
  {
    id: 5,
    title: 'Generate Access Keys',
    icon: '🔑',
    tag: 'Step 5',
    content: (
      <>
        <p>After creating the user, go to the user's detail page:</p>
        <ol>
          <li>Click the <strong>Security credentials</strong> tab</li>
          <li>Scroll to <strong>Access keys</strong> → click <strong>"Create access key"</strong></li>
          <li>Select <strong>"Application running outside AWS"</strong> as the use case</li>
          <li>Click <strong>Next → Create access key</strong></li>
        </ol>
        <div className="keyBox">
          <div className="keyItem">
            <span className="keyLabel">Access Key ID</span>
            <span className="keyExample">AKIAIOSFODNN7EXAMPLE</span>
            <span className="keyDesc">Starts with AKIA — this is your username for API calls</span>
          </div>
          <div className="keyItem">
            <span className="keyLabel">Secret Access Key</span>
            <span className="keyExample">wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY</span>
            <span className="keyDesc">Long random string — treat like a password</span>
          </div>
        </div>
        <div className="warning">
          <span>⚠️ Critical</span> The Secret Access Key is shown <strong>only once</strong>. Download the CSV or copy it immediately. You cannot retrieve it again.
        </div>
      </>
    ),
  },
  {
    id: 6,
    title: 'Enter Keys in Cloudburn',
    icon: '✅',
    tag: 'Final Step',
    content: (
      <>
        <p>Go back to the Cloudburn Connect page and enter your credentials:</p>
        <ol>
          <li>Paste the <strong>Access Key ID</strong> in the first field</li>
          <li>Paste the <strong>Secret Access Key</strong> in the second field</li>
          <li>Select your <strong>primary AWS region</strong> (e.g. <code>us-east-1</code>)</li>
          <li>Click <strong>"Connect"</strong></li>
        </ol>
        <p>Cloudburn will call <code>sts:GetCallerIdentity</code> to verify your credentials, then begin syncing your cost data automatically.</p>
        <div className="tip">
          <span>🔒 Security</span> Your keys are encrypted with AES-256 before being stored in our database. We never transmit or log raw credentials.
        </div>
      </>
    ),
  },
]

export default function AwsGuidePage() {
  const navigate = useNavigate()
  const [activeStep, setActiveStep] = useState(null)

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          ← Back
        </button>
        <div className={styles.topBadge}>AWS Setup Guide</div>
        <a
          href="https://console.aws.amazon.com/iam"
          target="_blank"
          rel="noreferrer"
          className={styles.openConsoleBtn}
        >
          Open AWS Console ↗
        </a>
      </div>

      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.heroIcon}>☁️</div>
        <h1>Connect AWS to Cloudburn</h1>
        <p>
          Follow these steps to create a secure, read-only IAM user and generate access keys.
          The entire setup takes about <strong>5 minutes</strong>.
        </p>
        <div className={styles.heroStats}>
          <div className={styles.heroBadge}>⏱ ~5 minutes</div>
          <div className={styles.heroBadge}>🔒 Read-only access</div>
          <div className={styles.heroBadge}>🚫 No resource changes ever</div>
        </div>
      </div>

      {/* What Cloudburn Reads */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>What Cloudburn Reads From Your AWS Account</h2>
        <div className={styles.dataGrid}>
          {[
            { icon: '💰', title: 'Billing & Cost', desc: 'Month-to-date spend, historical costs by service, daily usage breakdown' },
            { icon: '🖥️', title: 'EC2 Instances', desc: 'Instance types, CPU utilization, idle/zombie detection' },
            { icon: '🗄️', title: 'RDS Databases', desc: 'Database usage, idle detection, cost per DB' },
            { icon: '📦', title: 'S3 Storage', desc: 'Bucket sizes, storage costs, access patterns' },
            { icon: '📈', title: 'Cost Explorer', desc: 'Forecasts, anomaly detection, service-level breakdown' },
            { icon: '🆔', title: 'Account Identity', desc: 'Account ID verification via STS (read-only handshake)' },
          ].map(({ icon, title, desc }) => (
            <div className={styles.dataCard} key={title}>
              <div className={styles.dataIcon}>{icon}</div>
              <h4>{title}</h4>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Steps */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Step-by-Step Setup</h2>
        <div className={styles.steps}>
          {steps.map((step) => (
            <div
              key={step.id}
              className={`${styles.stepCard} ${activeStep === step.id ? styles.stepExpanded : ''}`}
            >
              <button
                className={styles.stepHeader}
                onClick={() => setActiveStep(activeStep === step.id ? null : step.id)}
              >
                <div className={styles.stepLeft}>
                  <span className={styles.stepNum}>{step.id}</span>
                  <span className={styles.stepIcon}>{step.icon}</span>
                  <div>
                    <span className={styles.stepTag}>{step.tag}</span>
                    <h3 className={styles.stepTitle}>{step.title}</h3>
                  </div>
                </div>
                <span className={`${styles.chevron} ${activeStep === step.id ? styles.chevronOpen : ''}`}>▼</span>
              </button>

              {activeStep === step.id && (
                <div className={styles.stepBody}>
                  {step.content}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* IAM Policy JSON */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Custom IAM Policy (Alternative to Managed Policies)</h2>
        <p className={styles.sectionDesc}>
          Instead of attaching multiple managed policies, you can create a single custom policy with all required permissions:
        </p>
        <div className={styles.codeBlock}>
          <div className={styles.codeHeader}>
            <span>cloudburn-readonly-policy.json</span>
            <button
              className={styles.copyBtn}
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(POLICY_JSON, null, 2))
                  .then(() => alert('Policy copied!'))
              }}
            >
              Copy JSON
            </button>
          </div>
          <pre>{JSON.stringify(POLICY_JSON, null, 2)}</pre>
        </div>
      </div>

      {/* Security Note */}
      <div className={styles.section}>
        <div className={styles.securityCard}>
          <div className={styles.securityTitle}>🔐 How Cloudburn Protects Your Credentials</div>
          <div className={styles.securityGrid}>
            {[
              { icon: '🔒', title: 'AES-256 Encryption', desc: 'Keys are encrypted before being saved to our database. Raw keys are never stored.' },
              { icon: '🚫', title: 'No Write Access', desc: 'All IAM policies are strictly read-only. Cloudburn cannot modify, create, or delete any AWS resource.' },
              { icon: '🔄', title: 'Key Rotation', desc: 'You can rotate or revoke your IAM keys at any time from the AWS Console. Cloudburn will prompt you to re-connect.' },
              { icon: '📵', title: 'No Third Parties', desc: 'Your credentials are never shared with or logged by any third-party service.' },
            ].map(({ icon, title, desc }) => (
              <div className={styles.securityItem} key={title}>
                <div className={styles.securityIcon}>{icon}</div>
                <div>
                  <h4>{title}</h4>
                  <p>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className={styles.cta}>
        <h2>Ready to connect?</h2>
        <p>You have all the information you need. Head back to connect your AWS account.</p>
        <button className={styles.ctaBtn} onClick={() => navigate('/connect')}>
          Connect AWS Account →
        </button>
      </div>
    </div>
  )
}

const POLICY_JSON = {
  Version: '2012-10-17',
  Statement: [
    {
      Sid: 'CloudburnBillingFullReadOnly',
      Effect: 'Allow',
      Action: [
        'ce:Get*',
        'ce:Describe*',
        'ce:List*',
        'aws-portal:ViewBilling',
        'aws-portal:ViewUsage',
        'billing:GetBillingData',
        'billing:GetBillingDetails',
        'billing:GetBillingNotifications',
        'billing:GetBillingPreferences',
        'billing:GetContractInformation',
        'billing:GetCredits',
        'billing:GetIAMAccessPreference',
        'billing:GetSellerOfRecord',
        'billing:ListBillingViews',
        'billingconductor:Get*',
        'billingconductor:List*',
        'budgets:ViewBudget',
        'budgets:DescribeBudgetAction',
        'cur:DescribeReportDefinitions',
        'cur:GetUsageReport',
        'purchase-orders:ViewPurchaseOrders',
        'purchase-orders:GetPurchaseOrder',
        'purchase-orders:ListPurchaseOrders',
      ],
      Resource: '*',
    },
    {
      Sid: 'CloudburnComputeAndStorageReadOnly',
      Effect: 'Allow',
      Action: [
        'ec2:Describe*',
        'ec2:GetConsoleOutput',
        'ec2:GetPasswordData',
        'rds:Describe*',
        'rds:ListTagsForResource',
        's3:GetBucketLocation',
        's3:GetBucketTagging',
        's3:GetBucketVersioning',
        's3:ListAllMyBuckets',
        's3:GetBucketPolicyStatus',
        'dynamodb:Describe*',
        'dynamodb:List*',
        'dynamodb:GetItem',
        'cloudwatch:GetMetricStatistics',
        'cloudwatch:ListMetrics',
        'cloudwatch:GetMetricData',
        'cloudwatch:DescribeAlarms',
      ],
      Resource: '*',
    },
    {
      Sid: 'CloudburnIdentityVerify',
      Effect: 'Allow',
      Action: ['sts:GetCallerIdentity'],
      Resource: '*',
    },
  ],
}
