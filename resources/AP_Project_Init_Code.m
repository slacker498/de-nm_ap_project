% This file simulates multiple damping conditions with regard to the rate
% of change in charge with respect to time for RLC Series Circuits

% Declaration of sample values 
L = 1; % in H
C = 0.01; % in F
R = 2; % in ohms (for underdamped)

%% Underdamped conditions with an AC source

syms q(t)
% from Lq'' + Rq' + q/c = V
% where V = 100 * sind(60*t) in V
[Vec_field] = odeToVectorField(diff(q, 2) == (100 * sin(60*t))/L - (q/C)/L - R*diff(q,1)/L);

odefun = matlabFunction(Vec_field, 'Vars',{'t', 'Y'});
tspan = [0,5];
q0 = [0; 0]; % q(0)=0, q'(0)=0

sol = ode45(odefun, tspan, q0);
figure(1)
fplot(@(x)deval(sol,x,1), tspan)
xlabel('t (sec)');
ylabel('q(t) (C)')
title('q(t) against from t=0 to t=0.5s for a Series RLC Circuit (Underdamped + AC Source)');
grid on
axis([-inf inf -0.75 0.75])


%% Underdamped conditions with a DC source

% from Lq'' + Rq' + q/c = V
% where V = 100 in V
syms q(t)
[Vec_field] = odeToVectorField(diff(q, 2) == (100)/L - (q/C)/L - R*diff(q,1)/L);

odefun = matlabFunction(Vec_field, 'Vars',{'t', 'Y'});
tspan = [0,7];
q0 = [0; 0]; % q(0)=0, q'(0)=0

sol = ode45(odefun, tspan, q0);
figure(2)
fplot(@(x)deval(sol,x,1), tspan)
xlabel('t (sec)');
ylabel('q(t) (C)')
title('q(t) against from t=0 to t=0.5s for a Series RLC Circuit (Underdamped + DC source)');
grid on
axis([-inf inf -0.25 2.5])

%% Critically damped condition with a DC source

% Declaration of sample values
R = 20; % in ohms

% from Lq'' + Rq' + q/c = V
% where V = 100 in V
syms q(t)
[Vec_field] = odeToVectorField(diff(q, 2) == (100)/L - (q/C)/L - R*diff(q,1)/L);

odefun = matlabFunction(Vec_field, 'Vars',{'t', 'Y'});
tspan = [0,5];
q0 = [0; 0];

sol = ode45(odefun, tspan, q0);
figure(3)
fplot(@(x)deval(sol,x,1), tspan)
xlabel('t (sec)');
ylabel('q(t) (C)')
title('q(t) against from t=0 to t=0.5s for a Series RLC Circuit (Critically damped + DC Source)');
grid on
axis([-inf inf -0.25 1.25])


%% Over damped condition with a DC source

% Declaration of sample values
R = 100; % in ohms

syms q(t)
% from Lq'' + Rq' + q/c = V
% where V = 100 in V
[Vec_field] = odeToVectorField(diff(q, 2) == (100)/L - (q/C)/L - R*diff(q,1)/L);

odefun = matlabFunction(Vec_field, 'Vars',{'t', 'Y'});
tspan = [0,10];
q0 = [0; 0];

sol = ode45(odefun, tspan, q0);
figure(4)
fplot(@(x)deval(sol,x,1), tspan)
xlabel('t (sec)');
ylabel('q(t) (C)')
title('q(t) against from t=0 to t=0.5s for a Series RLC Circuit (Over damped + DC source)');
grid on
axis([-inf inf -0.25 1.5])