import { useState } from "react";
// @ts-ignore
import { Box, Text, Input, Checkbox, Button } from '@adminjs/design-system';
// @ts-ignore
import { useNotice, ApiClient } from 'adminjs'

enum Sections {
  general = 'general',
  web = 'web',
  mobile = 'mobile',
  storage = 'storage',
  payments = 'payments',
  ai = 'ai',
}

const styles = {
  infoRoot: {
    fontSize: 12,
    marginBottom: 8,
    display: 'block',
    padding: 16,
    background: 'rgb(137, 138, 154, 0.1)',
    borderRadius: 4,
    margin: '12px 0',
  },
  label: {
    fontSize: 16,
    marginBottom: 0,
  },
  itemRoot: {
    marginBottom: 16,
  }
}


const SECTIONS = {
  [Sections.general]: {
    title: 'General',
    items: [
      {
        name: 'appName',
        label: 'App Name',
      },
      {
        name: 'googleMapsApiKey',
        label: 'Google Maps API Key',
        description: 'The API key for the Google Maps service',
      },
      {
        name: 'defaultCurrencyId',
        label: 'Default Currency',
        description: 'The default currency for the app. This is only the ID of the currency, not the name.',
      },
      {
        name: 'maxProductPrice',
        label: 'Max Product Price',
        description: 'The maximum price of a product inside a post',
      },
      {
        name: 'promotionCoinsCost',
        label: 'Promotion Coins Cost',
        description: 'The cost of a post promotion in coins',
      },
      {
        name: 'allowValidationRequest',
        label: 'Allow Validation Request',
        description: 'A user can request a validation of their account by sending a request to the admin. This flag controls if this feature is enabled',
        checkbox: true,
      },
      {
        name: 'defaultProductImageUrl',
        label: 'Default Product Image URL',
        description: 'If a user does not upload an image when creating a post, the default image will be used',
      },
      {
        name: 'freePostsCount',
        label: 'Free Posts Count',
        description: 'The number of free posts a user can create, without using coins',
      },
      {
        name: 'postsCoinsCost',
        label: 'Posts Coins Cost',
        description: 'The cost of a post in coins',
      },
      {
        name: 'emailValidationEnabled',
        label: 'Email Validation Enabled',
        description: 'If this is enabled, we will send a validation email to the user when they sign up',
        checkbox: true,
      },
      {
        name: 'allowUnvalidatedUsersToCreatePosts',
        label: 'Allow Unvalidated Users To Create Posts',
        description: 'If this is enabled, unvalidated users will be able to create posts',
        checkbox: true,
      },
      {
        name: 'allowAnonymousUsersToCreatePosts',
        label: 'Allow Anonymous Users To Create Posts',
        description: 'If this is enabled, anonymous users will be able to create posts',
        checkbox: true,
      },
      {
        name: 'allowMultipleCurrencies',
        label: 'Allow Multiple Currencies',
        description: 'If this is enabled, users will be able to use multiple currencies',
        checkbox: true,
      }
    ]
  },
  [Sections.mobile]: {
    title: 'Mobile App Settings',
    items: [
      {
        name: 'confidentialityLink',
        label: 'Confidentiality Link',
        description: 'The link to the confidentiality policy',
      },
      {
        name: 'revenueCatAndroidKey',
        label: 'RevenueCat Android Key',
        description: 'The key for the RevenueCat Android app',
      },
      {
        name: 'revenueCatIOSKey',
        label: 'RevenueCat IOS Key',
        description: 'The key for the RevenueCat IOS app',
      },
      {
        name: 'adsEnabledOnAndroid',
        label: 'Ads Enabled On Android',
        description: 'If this is enabled, ads will be shown on the Android app',
        checkbox: true,
      },
      {
        name: 'adsEnabledOnIOS',
        label: 'Ads Enabled On IOS',
        description: 'If this is enabled, ads will be shown on the IOS app',
        checkbox: true,
      },
      {
        name: 'androidAdsBannerId',
        label: 'Android Ads Banner ID',
        description: 'The ID of the banner ad for the Android app',
      },
      {
        name: 'androidAdsInterstitialId',
        label: 'Android Ads Interstitial ID',
        description: 'The ID of the interstitial ad for the Android app',
      },
      {
        name: 'androidAdsRewardedId',
        label: 'Android Ads Rewarded ID',
        description: 'The ID of the rewarded ad for the Android app',
      },
      {
        name: 'iosAdsBannerId',
        label: 'IOS Ads Banner ID',
        description: 'The ID of the banner ad for the IOS app',
      },
      {
        name: 'iosAdsInterstitialId',
        label: 'IOS Ads Interstitial ID',
        description: 'The ID of the interstitial ad for the IOS app',
      },
      {
        name: 'iosAdsRewardedId',
        label: 'IOS Ads Rewarded ID',
        description: 'The ID of the rewarded ad for the IOS app',
      }
    ]
  },
  [Sections.web]: {
    title: 'Web App Settings',
    items: [
      {
        name: 'webAppUrl',
        label: 'Web App URL',
        description: 'The URL of the web app. Used in the footer of the web app',
      },
      {
        name: 'accountPageLayout',
        label: 'Account Page Layout',
        values: ['tabs', 'sidebar'],
        description: 'If the layout is "sidebar", the account page will have a sidebar menu. If the layout is "tabs", the account page will have a tab menu.',
      },
      {
        name: 'profilePageLayout',
        label: 'Profile Page Layout',
        values: ['tabs', 'sidebar'],
        description: 'If the layout is "sidebar", the profile page will have a sidebar menu. If the layout is "tabs", the profile page will have a tab menu.',
      },
      {
        name: 'vapidPrivateKey',
        label: 'VAPID Private Key',
        description: 'The private key for the VAPID service (used for push notifications)',
      },
      {
        name: 'vapidPublicKey',
        label: 'VAPID Public Key',
        description: 'The public key for the VAPID service (used for push notifications)',
      },
      {
        name: 'vapidSupportEmail',
        label: 'VAPID Support Email',
        description: 'The email address of the support team (used for push notifications)',
      },
      {
        name: 'googlePlayLink',
        label: 'Google Play Link',
        description: 'The link to the Google Play app. Used in the footer of the web app',
      },
      {
        name: 'appStoreLink',
        label: 'App Store Link',
        description: 'The link to the App Store app. Used in the footer of the web app',
      },
    ]
  },
  [Sections.payments]: {
    title: 'Web Payments Settings',
    items: [
      {
        name: 'stripeSecretKey',
        label: 'Stripe Secret Key',
        description: 'The secret key for the Stripe payment service',
      },
      {
        name: 'stripeWehookSigningSecret',
        label: 'Stripe Webhook Secret',
        description: 'The secret key for the Stripe webhook',
      },
      {
        name: 'paypalClientId',
        label: 'Paypal Client ID',
        description: 'The client ID for the Paypal payment service',
      },
      {
        name: 'paypalClientSecret',
        label: 'Paypal Client Secret',
        description: 'The client secret for the Paypal payment service',
      },
      {
        name: 'razorpayKeyId',
        label: 'Razorpay Key ID',
        description: 'The key ID for the Razorpay payment service',
      },
      {
        name: 'razorpaySecretKey',
        label: 'Razorpay Secret Key',
        description: 'The secret key for the Razorpay payment service',
      },
      {
        name: 'razorpayWebhookSecret',
        label: 'Razorpay Webhook Secret',
        description: 'The secret key for the Razorpay webhook',
      },
    ]
  },
  [Sections.storage]: {
    title: 'Storage Settings',
    items: [
      {
        name: 'googleCloudStorageBucket',
        label: 'Google Cloud Storage Bucket',
        description: 'The bucket for the Google Cloud Storage',
      },
      {
        name: 'awsAccessKeyId',
        label: 'AWS Access Key ID',
        description: 'The access key ID for the AWS storage',
      },
      {
        name: 'awsSecretAccessKey',
        label: 'AWS Secret Access Key',
        description: 'The secret access key for the AWS storage',
      },
      {
        name: 'awsStorageBucket',
        label: 'AWS Storage Bucket',
        description: 'The bucket for the AWS storage',
      },
      {
        name: 'awsStorageRegion',
        label: 'AWS Storage Region',
        description: 'The region for the AWS storage',
      },
    ],
  },
  [Sections.ai]: {
    title: 'AI Settings',
    items: [
      {
        name: 'openAiApiKey',
        label: 'OpenAI API Key',
        description: 'The API key for the OpenAI service',
      },
      {
        name: 'allowAiResponsesOnUnvalidatedEmails',
        label: 'Allow AI Responses On Unvalidated Emails',
        description: 'If this is enabled, AI responses will be allowed on unvalidated emails',
        checkbox: true,
      },
      {
        name: 'freeAiResponses',
        label: 'Free AI Responses',
        description: 'The number of free AI responses a user can get',
      },
      {
        name: 'aiResponsesPriceInCoins',
        label: 'AI Responses Price In Coins',
        description: 'The price of an AI response in coins',
      },
      {
        name: 'maxAiResponsesPerUser',
        label: 'Max AI Responses Per User',
        description: 'The maximum number of AI responses a user can get, either free or paid',
      },
    ]
  }
}

const SettingsEditPage = ({ record, currentAdmin }) => {
  const [formData, setFormData] = useState(record.params);
  const notice = useNotice()

  const [saveInProgress, setSaveInProgress] = useState(false)

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    [Sections.general]: true,
    [Sections.mobile]: true,
    [Sections.web]: true,
    [Sections.payments]: true,
    [Sections.storage]: true,
    [Sections.ai]: true,
  })


  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaveInProgress(true)
      const api = new ApiClient();

      await api.recordAction({
        resourceId: 'settings',
        recordId: record.id,
        actionName: 'edit',
        data: formData,
      })

      // @ts-ignore
      window.location.href = `/admin/resources/settings/records/${record.id}/show`

    } catch (error) {
      console.error('Could not update settings', error)
      notice({ message: 'Could not update settings', type: 'error' })
    } finally {
      setSaveInProgress(false)
    }
  };

  function toggleSection(title) {
    setExpandedSections((prev) => ({ ...prev, [title]: !prev[title] }))
  }

  return (
    <div>
      {Object.keys(SECTIONS).map((section) => (
        <div key={section} className="card mb-3">
          <div
            className="card-header d-flex justify-content-between align-items-center"
            onClick={() => toggleSection(section)}
          >
            <strong>{SECTIONS[section].title}</strong>
            <span>
              {expandedSections[section] ? '▼' : '▶'}
            </span>
          </div>
          {expandedSections[section] && (
            <div className="card-body">
              {SECTIONS[section].items.map((item) => (
                <div key={item.name} className="mb-3" style={styles.itemRoot}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                    <label className="form-label" style={styles.label} title={item.description}>{item.label}</label>
                    {item.description && <div>
                      <Tooltip text={item.description}>
                        <span
                          className="ms-2"
                          title={item.description}
                          style={{
                            cursor: 'help',
                            fontSize: '14px',
                            color: 'black'
                          }}
                        >
                          ❔
                        </span>
                      </Tooltip>
                    </div>}

                  </div>
                  {item.checkbox ? (
                    <input
                      type="checkbox"
                      className="form-check-input"
                      name={item.name}
                      checked={formData[item.name] === true}
                      onChange={handleChange}
                    />
                  ) : item.values?.length ? (
                    <select
                      className="form-select"
                      name={item.name}
                      value={formData[item.name] || ''}
                      onChange={handleChange}
                    >
                      {item.values.map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      className="form-control"
                      name={item.name}
                      value={formData[item.name] || ''}
                      onChange={handleChange}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      <button className="btn btn-success w-100" onClick={handleSubmit} disabled={saveInProgress}> {saveInProgress ? 'Saving...' : 'Save'} </button>
    </div>
  )
}


const Tooltip = ({ children, text }) => {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className="tooltip-container"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && <div className="tooltip">{text}</div>}
    </div>
  );
};

export default SettingsEditPage