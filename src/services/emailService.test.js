const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test' });
jest.mock('../config/email.js', () => ({
  createTransporter: () => ({ sendMail: mockSendMail }),
  buildMailOptions: (options) => options,
}));
jest.mock('../config/db.js', () => ({ prisma: {} }));

const { sendEmail } = require('./emailService.js');
const { emailTemplates, EMAIL_LOGO_URL } = require('../utils/emailTemplates.js');

const templateArguments = {
  verification: ['123456', 'Reader'],
  welcome: ['Reader'],
  passwordReset: ['123456', 'Reader'],
  accountCreated: [{ firstName: 'Reader', username: 'reader', password: 'temporary', role: 'Member' }],
  newSupportTicket: [{
    ticket: { ticketCode: 'TEST-1', subject: 'Help', category: 'General', priority: 'Normal', messages: [{ body: 'Help please' }] },
    reporter: { firstName: 'Reader', email: 'reader@example.com' },
    adminUrl: 'https://app.exegesisproject.org/admin',
  }],
};

test.each(Object.keys(emailTemplates))('%s sends the remote logo without an attachment', async (name) => {
  mockSendMail.mockClear();
  expect(templateArguments[name]).toBeDefined();
  const template = emailTemplates[name](...templateArguments[name]);
  await sendEmail('reader@example.com', template.subject, template.html);
  const options = mockSendMail.mock.calls[0][0];
  expect(options.html).toContain(`src="${EMAIL_LOGO_URL}"`);
  expect(options.html).not.toContain('cid:');
  expect(options.html).not.toContain('/assets/logo.png');
  expect(options.html).not.toContain('data:image/');
  expect(options.html.match(/<img\b/g)).toHaveLength(1);
  expect(options.html.match(/<h1\b/g)).toHaveLength(1);
  expect(options.attachments).toBeUndefined();
});
