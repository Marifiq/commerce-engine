import { PrismaClient } from '@prisma/client';

const policies = [
  {
    type: 'privacy',
    title: 'Privacy Policy',
    content: `
      <h2>Privacy Policy</h2>
      <p><strong>Last Updated:</strong> ${new Date().toLocaleDateString()}</p>
      
      <h3>1. Introduction</h3>
      <p>We respect your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, use, and safeguard your information when you visit our website and make purchases.</p>
      
      <h3>2. Information We Collect</h3>
      <p>We collect information that you provide directly to us, including:</p>
      <ul>
        <li>Name, email address, and contact information</li>
        <li>Shipping and billing addresses</li>
        <li>Payment information (processed securely through third-party providers)</li>
        <li>Order history and preferences</li>
        <li>Account credentials</li>
      </ul>
      
      <h3>3. How We Use Your Information</h3>
      <p>We use the information we collect to:</p>
      <ul>
        <li>Process and fulfill your orders</li>
        <li>Communicate with you about your orders and account</li>
        <li>Send you marketing communications (with your consent)</li>
        <li>Improve our website and services</li>
        <li>Prevent fraud and ensure security</li>
      </ul>
      
      <h3>4. Data Security</h3>
      <p>We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction.</p>
      
      <h3>5. Your Rights</h3>
      <p>You have the right to:</p>
      <ul>
        <li>Access your personal data</li>
        <li>Correct inaccurate data</li>
        <li>Request deletion of your data</li>
        <li>Opt-out of marketing communications</li>
      </ul>
      
      <h3>6. Cookies</h3>
      <p>We use cookies to enhance your browsing experience, analyze site traffic, and personalize content. You can control cookie preferences through your browser settings.</p>
      
      <h3>7. Third-Party Services</h3>
      <p>We may share your information with trusted third-party service providers who assist us in operating our website and conducting business, subject to strict confidentiality agreements.</p>
      
      <h3>8. Contact Us</h3>
      <p>If you have questions about this privacy policy, please contact us through our <a href="/policies/contact">Contact Us</a> page.</p>
    `,
    isActive: true,
  },
  {
    type: 'terms',
    title: 'Terms of Service',
    content: `
      <h2>Terms of Service</h2>
      <p><strong>Last Updated:</strong> ${new Date().toLocaleDateString()}</p>
      
      <h3>1. Acceptance of Terms</h3>
      <p>By accessing and using this website, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our website.</p>
      
      <h3>2. Use of Website</h3>
      <p>You agree to use our website only for lawful purposes and in a way that does not infringe the rights of others or restrict their use of the website.</p>
      
      <h3>3. Account Registration</h3>
      <p>When you create an account, you are responsible for:</p>
      <ul>
        <li>Maintaining the confidentiality of your account credentials</li>
        <li>All activities that occur under your account</li>
        <li>Providing accurate and current information</li>
      </ul>
      
      <h3>4. Products and Pricing</h3>
      <p>We strive to provide accurate product descriptions and pricing. However, we reserve the right to:</p>
      <ul>
        <li>Correct any errors in pricing or descriptions</li>
        <li>Refuse or cancel orders for any reason</li>
        <li>Limit quantities purchased per person or per order</li>
      </ul>
      
      <h3>5. Orders and Payment</h3>
      <p>All orders are subject to product availability and our acceptance. We reserve the right to refuse or cancel any order for any reason, including but not limited to:</p>
      <ul>
        <li>Product availability</li>
        <li>Errors in pricing or product information</li>
        <li>Fraudulent or illegal activity</li>
      </ul>
      
      <h3>6. Intellectual Property</h3>
      <p>All content on this website, including text, graphics, logos, images, and software, is the property of our company and is protected by copyright and trademark laws.</p>
      
      <h3>7. Limitation of Liability</h3>
      <p>To the fullest extent permitted by law, we shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our website or products.</p>
      
      <h3>8. Changes to Terms</h3>
      <p>We reserve the right to modify these terms at any time. Your continued use of the website after changes constitutes acceptance of the new terms.</p>
      
      <h3>9. Governing Law</h3>
      <p>These terms are governed by and construed in accordance with applicable laws. Any disputes will be resolved in the appropriate courts.</p>
      
      <h3>10. Contact Information</h3>
      <p>For questions about these terms, please contact us through our <a href="/policies/contact">Contact Us</a> page.</p>
    `,
    isActive: true,
  },
  {
    type: 'refund',
    title: 'Refund Policy',
    content: `
      <h2>Refund Policy</h2>
      <p><strong>Last Updated:</strong> ${new Date().toLocaleDateString()}</p>
      
      <h3>1. Eligibility for Refunds</h3>
      <p>We offer refunds for items that meet the following criteria:</p>
      <ul>
        <li>Items returned within 30 days of delivery</li>
        <li>Items in original, unworn condition with tags attached</li>
        <li>Items that are defective or damaged upon arrival</li>
        <li>Items that differ from the description on our website</li>
      </ul>
      
      <h3>2. Non-Refundable Items</h3>
      <p>The following items are not eligible for refunds:</p>
      <ul>
        <li>Items marked as "Final Sale"</li>
        <li>Items that have been worn, washed, or damaged by the customer</li>
        <li>Items returned after 30 days</li>
        <li>Custom or personalized items</li>
      </ul>
      
      <h3>3. Refund Process</h3>
      <p>To request a refund:</p>
      <ol>
        <li>Log in to your account and navigate to your orders</li>
        <li>Select the item you want to refund</li>
        <li>Fill out the refund request form</li>
        <li>Return the item in its original packaging with tags attached</li>
        <li>Wait for processing (5-7 business days after we receive the item)</li>
      </ol>
      
      <h3>4. Refund Processing Time</h3>
      <p>Once we receive and inspect your returned item:</p>
      <ul>
        <li>We will process your refund within 5-7 business days</li>
        <li>Refunds will be issued to your original payment method</li>
        <li>You will receive an email confirmation when the refund is processed</li>
        <li>It may take additional time for the refund to appear in your account (depending on your bank or payment provider)</li>
      </ul>
      
      <h3>5. Shipping Costs</h3>
      <p>Original shipping costs are non-refundable unless:</p>
      <ul>
        <li>The item was defective or incorrect</li>
        <li>The return is due to our error</li>
      </ul>
      <p>Return shipping costs are the responsibility of the customer unless the item was defective or incorrect.</p>
      
      <h3>6. Partial Refunds</h3>
      <p>Partial refunds may be issued for:</p>
      <ul>
        <li>Items returned in less than perfect condition</li>
        <li>Items missing original packaging or tags</li>
        <li>Items that have been used or damaged</li>
      </ul>
      
      <h3>7. Refund Methods</h3>
      <p>Refunds will be processed to the original payment method used for the purchase. If the original payment method is no longer available, please contact us to arrange an alternative refund method.</p>
      
      <h3>8. Need Help?</h3>
      <p>If you have questions about refunds, please <a href="/policies/contact">contact us</a> and we'll be happy to assist you.</p>
    `,
    isActive: true,
  },
  {
    type: 'return',
    title: 'Return Policy',
    content: `
      <h2>Return Policy</h2>
      <p><strong>Last Updated:</strong> ${new Date().toLocaleDateString()}</p>
      
      <h3>1. Return Window</h3>
      <p>You have 30 days from the date of delivery to return items for a full refund or exchange. Items must be in original, unworn condition with all tags attached.</p>
      
      <h3>2. Return Conditions</h3>
      <p>To be eligible for a return, items must:</p>
      <ul>
        <li>Be unworn, unwashed, and in original condition</li>
        <li>Have all original tags attached</li>
        <li>Be in original packaging when possible</li>
        <li>Be returned within 30 days of delivery</li>
      </ul>
      
      <h3>3. Non-Returnable Items</h3>
      <p>The following items cannot be returned:</p>
      <ul>
        <li>Items marked as "Final Sale"</li>
        <li>Items that have been worn, washed, or damaged</li>
        <li>Items without original tags or packaging</li>
        <li>Custom or personalized items</li>
        <li>Items returned after 30 days</li>
      </ul>
      
      <h3>4. How to Return</h3>
      <p>To initiate a return:</p>
      <ol>
        <li>Log in to your account and go to your orders</li>
        <li>Select the item you want to return</li>
        <li>Fill out the return request form</li>
        <li>Print the return label (if provided) or use your own shipping method</li>
        <li>Package the item securely in its original packaging</li>
        <li>Ship the package to our return address</li>
      </ol>
      
      <h3>5. Return Shipping</h3>
      <p>Customers are responsible for return shipping costs unless:</p>
      <ul>
        <li>The item was defective or incorrect</li>
        <li>The return is due to our error</li>
      </ul>
      <p>We may provide a prepaid return label in certain cases.</p>
      
      <h3>6. Processing Time</h3>
      <p>Once we receive your return:</p>
      <ul>
        <li>We will inspect the item within 2-3 business days</li>
        <li>Refunds will be processed within 5-7 business days</li>
        <li>You will receive an email confirmation when processing is complete</li>
      </ul>
      
      <h3>7. Exchanges</h3>
      <p>We're happy to exchange items for a different size or color, subject to availability. Exchanges follow the same guidelines as returns and must be requested within 30 days of delivery.</p>
      
      <h3>8. Refunds</h3>
      <p>Refunds will be issued to your original payment method. Processing time is 5-7 business days after we receive your return. For more details, see our <a href="/policies/refund">Refund Policy</a>.</p>
      
      <h3>9. Need Help?</h3>
      <p>If you have questions about returns, please <a href="/policies/contact">contact us</a> and we'll be happy to assist you.</p>
    `,
    isActive: true,
  },
  {
    type: 'shipping',
    title: 'Shipping Policy',
    content: `
      <h2>Shipping Policy</h2>
      <p><strong>Last Updated:</strong> ${new Date().toLocaleDateString()}</p>
      
      <h3>1. Shipping Methods</h3>
      <p>We offer several shipping options to meet your needs:</p>
      <ul>
        <li><strong>Standard Shipping:</strong> 5-7 business days</li>
        <li><strong>Express Shipping:</strong> 2-3 business days</li>
        <li><strong>Overnight Shipping:</strong> Next business day (if ordered before cutoff time)</li>
      </ul>
      
      <h3>2. Shipping Costs</h3>
      <p>Shipping costs are calculated at checkout based on:</p>
      <ul>
        <li>Shipping method selected</li>
        <li>Package weight and dimensions</li>
        <li>Delivery destination</li>
      </ul>
      <p>Free shipping may be available for orders over a certain amount. Check our current promotions for details.</p>
      
      <h3>3. Processing Time</h3>
      <p>Orders are typically processed within 1-2 business days. Processing may take longer during:</p>
      <ul>
        <li>Holiday seasons</li>
        <li>Sales events</li>
        <li>High-volume periods</li>
      </ul>
      
      <h3>4. Delivery Timeframes</h3>
      <p>Delivery timeframes are estimates and begin after order processing is complete. Actual delivery times may vary based on:</p>
      <ul>
        <li>Shipping method selected</li>
        <li>Delivery destination</li>
        <li>Weather conditions</li>
        <li>Carrier delays</li>
      </ul>
      
      <h3>5. International Shipping</h3>
      <p>We ship to most countries worldwide. International shipping:</p>
      <ul>
        <li>May take 7-21 business days depending on destination</li>
        <li>May be subject to customs duties and taxes (customer's responsibility)</li>
        <li>Delivery times may vary by country</li>
      </ul>
      
      <h3>6. Order Tracking</h3>
      <p>Once your order ships, you will receive:</p>
      <ul>
        <li>An email with tracking information</li>
        <li>A tracking number to monitor your package</li>
        <li>Updates on delivery status</li>
      </ul>
      <p>You can also track your order by logging into your account.</p>
      
      <h3>7. Shipping Address</h3>
      <p>Please ensure your shipping address is correct at checkout. We are not responsible for:</p>
      <ul>
        <li>Orders shipped to incorrect addresses provided by the customer</li>
        <li>Lost packages due to incorrect addresses</li>
        <li>Additional shipping costs for address corrections</li>
      </ul>
      
      <h3>8. Undeliverable Packages</h3>
      <p>If a package is returned to us as undeliverable:</p>
      <ul>
        <li>We will contact you to confirm the address</li>
        <li>You may be charged for reshipping</li>
        <li>If we cannot reach you, the order may be cancelled and refunded (minus shipping costs)</li>
      </ul>
      
      <h3>9. Damaged or Lost Packages</h3>
      <p>If your package arrives damaged or is lost in transit:</p>
      <ul>
        <li>Contact us immediately with photos (if damaged)</li>
        <li>We will investigate and resolve the issue</li>
        <li>We may send a replacement or issue a full refund</li>
      </ul>
      
      <h3>10. Multiple Items</h3>
      <p>If your order contains multiple items:</p>
      <ul>
        <li>Items may ship separately if they come from different locations</li>
        <li>You will receive separate tracking numbers for each shipment</li>
        <li>Shipping costs are calculated per shipment</li>
      </ul>
      
      <h3>11. Need Help?</h3>
      <p>If you have questions about shipping, please <a href="/policies/contact">contact us</a> and we'll be happy to assist you.</p>
    `,
    isActive: true,
  },
];

export async function seedPolicies(prisma: PrismaClient) {
  console.log('📋 Seeding policies...\n');

  for (const policyData of policies) {
    try {
      // Check if policy already exists
      const existingPolicy = await prisma.policy.findUnique({
        where: { type: policyData.type },
      });

      if (existingPolicy) {
        // Update existing policy
        await prisma.policy.update({
          where: { type: policyData.type },
          data: {
            title: policyData.title,
            content: policyData.content,
            isActive: policyData.isActive,
          },
        });
        console.log(`  ✅ Updated: ${policyData.title}`);
      } else {
        // Create new policy
        await prisma.policy.create({
          data: policyData,
        });
        console.log(`  ✨ Created: ${policyData.title}`);
      }
    } catch (error) {
      console.error(`  ❌ Error seeding ${policyData.title}:`, error);
    }
  }

  console.log('\n📋 Policy seeding completed!\n');
}




