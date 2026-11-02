#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>
#import <ReactAppDependencyProvider/RCTAppDependencyProvider.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.dependencyProvider = [RCTAppDependencyProvider new];
  self.reactNativeFactory = [[RCTReactNativeFactory alloc] initWithDelegate:self];
  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];

  [self.reactNativeFactory startReactNativeWithModuleName:@"SwipeKlinCleaner"
                                                 inWindow:self.window
                                        initialProperties:@{}
                                            launchOptions:launchOptions];

  return YES;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}

- (NSURL *)bundleURL
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

@end
