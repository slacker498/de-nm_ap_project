%% Figure Replication
%%
function charge_plotter(alpha, wo)
    h = 0.0005; t = 0:h:10;
    f1 = @(q, x) -2*alpha*x - wo^2*q; % where f1 = x'
    f2 = @(x) x; % where f2 = q'
    
    xn_1 = @(xn, f) xn + h*f;
    qn_1 = @(qn, f) qn + h*f;
    
    x_euler = zeros(1, length(t)); x_euler(1) = 0; % v_euler is the same as y'
    q_euler = zeros(1, length(t)); q_euler(1) = 1; % y_euler is the same as y
    
    for i = 1:length(x_euler)-1
        q_euler(i+1) = qn_1(q_euler(i), f2(x_euler(i)));
        x_euler(i+1) = xn_1(x_euler(i), f1(q_euler(i), x_euler(i)));
    end
    
    figure
    plot(t, q_euler, 'LineWidth',1.5);
    xlabel("Time, t");
    ylabel("Charge, q(t)")
    title("Time-series plot of q(t) against t");
    grid on
    ylim([min(q_euler)-1 max(q_euler)+1])
    
    figure
    plot(t, x_euler, 'LineWidth',1.5);
    xlabel("Time, t");
    ylabel("x(t)")
    title("Time-series plot of q'(t) [or x(t)] against t");
    grid on
    ylim([min(x_euler)-1 max(x_euler)+1])

    figure
    plot(q_euler, x_euler, 'g', 'LineWidth', 1.5)
    xlabel('Charge, q(t) (C)')
    ylabel('Current, i(t) = dq/dt (A)')
    title('Phase Portrait: x(t) against q(t)')
    grid on

end

%% Underdamping
alpha = 1.5; wo = 6;
charge_plotter(alpha, wo);

%% Overdamping
alpha = 8; wo = 4;
charge_plotter(alpha, wo);

%% Critical damping
alpha = 4; wo = 4;
charge_plotter(alpha, wo);