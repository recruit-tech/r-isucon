import { PrivateIsuconPortalPage } from './app.po';

describe('yisucon1-portal App', function() {
  let page: PrivateIsuconPortalPage;

  beforeEach(() => {
    page = new PrivateIsuconPortalPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
